import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { timetableAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import CellHistoryModal from '../components/CellHistoryModal';

const TimetableView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [timetable, setTimetable] = useState(null);
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const departments = ['NONE', 'CS', 'ECE', 'IT', 'MNC', 'ML'];

  useEffect(() => {
    if (!id) return;
    fetchTimetable();
  }, [id]);

  const fetchTimetable = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await timetableAPI.getOne(id);
      const data = response?.data?.data;
      setTimetable(data?.timetable || null);
      setCells(Array.isArray(data?.cells) ? data.cells : []);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch timetable');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const canEditCell = (cell) => {
    if (!user || !cell) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'USER') return false;
    if (cell.department === 'NONE') return true;
    return cell.department === user.department;
  };

  const handleCellClick = (cell) => {
    const canEdit = canEditCell(cell);
    if (canEdit) {
      setEditingCell({
        id: cell._id,
        subject: cell.subject,
        department: cell.department,
      });
    } else {
      toast.error('You do not have permission to edit this cell');
    }
  };

  const handleSaveCell = async () => {
    if (!editingCell) return;
    if (!editingCell.subject?.trim()) {
      toast.error('Subject cannot be empty');
      return;
    }

    try {
      await timetableAPI.updateCell(editingCell.id, {
        subject: editingCell.subject.trim(),
        department: editingCell.department,
      });
      toast.success('Cell updated successfully');
      fetchTimetable();
      setEditingCell(null);
    } catch (error) {
      console.error('Failed to update cell:', error);
      toast.error(error?.response?.data?.message || 'Failed to update cell');
    }
  };

  const handleShowHistory = (cell) => {
    if (!cell) return;
    setSelectedCell(cell);
    setShowHistoryModal(true);
  };

  const exportToPDF = async () => {
    setExportingPDF(true);
    const loadingToast = toast.loading('Generating professional PDF...');
    
    try {
      // Create PDF document in landscape
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Add gradient-style header background
      doc.setFillColor(59, 130, 246); // Primary blue
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      // Add title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      const title = timetable?.className || 'Timetable';
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, 15);
      
      // Add subtitle
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const subtitle = `Room ${timetable?.roomName || 'N/A'} • Academic Schedule`;
      const subtitleWidth = doc.getTextWidth(subtitle);
      doc.text(subtitle, (pageWidth - subtitleWidth) / 2, 25);

      // Department colors mapping
      const deptColors = {
        'CS': [219, 234, 254],      // Blue
        'ECE': [243, 232, 255],     // Purple
        'IT': [209, 250, 229],      // Emerald
        'MNC': [254, 215, 170],     // Orange
        'ML': [252, 231, 243],      // Pink
        'NONE': [241, 245, 249]     // Slate
      };

      // Prepare table data
      const days = timetable?.days || [];
      const periodsPerDay = timetable?.periodsPerDay || 0;
      
      // Create cell lookup
      const cellLookup = {};
      cells.forEach(cell => {
        const key = `${cell.day}-${cell.period}`;
        cellLookup[key] = cell;
      });

      // Build table headers
      const headers = [['Day / Period']];
      for (let i = 1; i <= periodsPerDay; i++) {
        headers[0].push(`Period ${i}`);
      }

      // Build table body
      const body = days.map(day => {
        const row = [day];
        for (let period = 1; period <= periodsPerDay; period++) {
          const key = `${day}-${period}`;
          const cell = cellLookup[key];
          
          if (cell && cell.subject && cell.subject !== 'Empty') {
            const dept = cell.department !== 'NONE' ? `\n(${cell.department})` : '';
            row.push(`${cell.subject}${dept}`);
          } else {
            row.push('');
          }
        }
        return row;
      });

      // Generate table using autoTable
      autoTable(doc,{
        startY: 40,
        head: headers,
        body: body,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 5,
          lineColor: [203, 213, 225],
          lineWidth: 0.5,
          textColor: [51, 65, 85],
          halign: 'center',
          valign: 'middle',
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          halign: 'center',
        },
        columnStyles: {
          0: { 
            fillColor: [248, 250, 252],
            fontStyle: 'bold',
            halign: 'left',
            cellWidth: 35
          }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        didParseCell: function(data) {
          // Apply department colors to body cells
          if (data.section === 'body' && data.column.index > 0) {
            const rowIndex = data.row.index;
            const colIndex = data.column.index;
            const day = days[rowIndex];
            const period = colIndex;
            const key = `${day}-${period}`;
            const cell = cellLookup[key];
            
            if (cell && cell.department && cell.department !== 'NONE') {
              const color = deptColors[cell.department] || deptColors['NONE'];
              data.cell.styles.fillColor = color;
            }
          }
        },
        margin: { top: 40, right: 10, bottom: 30, left: 10 },
      });

      // Add legend
      const finalY = doc.lastAutoTable.finalY || 40;
      const legendY = finalY + 10;

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');
      doc.text('Department Legend:', 15, legendY);

      // Legend items
      const legendItems = [
        { dept: 'CS', name: 'Computer Science', color: deptColors['CS'] },
        { dept: 'ECE', name: 'Electronics', color: deptColors['ECE'] },
        { dept: 'IT', name: 'Information Tech', color: deptColors['IT'] },
        { dept: 'MNC', name: 'Mechatronics', color: deptColors['MNC'] },
        { dept: 'ML', name: 'Machine Learning', color: deptColors['ML'] }
      ];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      let legendX = 15;
      let legendItemY = legendY + 7;
      
      legendItems.forEach((item, index) => {
        // Draw colored box
        doc.setFillColor(...item.color);
        doc.rect(legendX, legendItemY - 3, 6, 4, 'F');
        
        // Draw border
        doc.setDrawColor(203, 213, 225);
        doc.rect(legendX, legendItemY - 3, 6, 4, 'S');
        
        // Draw text
        doc.setTextColor(100, 116, 139);
        doc.text(`${item.dept} - ${item.name}`, legendX + 8, legendItemY);
        
        // Move to next position (3 items per row)
        if ((index + 1) % 3 === 0) {
          legendX = 15;
          legendItemY += 7;
        } else {
          legendX += 85;
        }
      });

      // Add footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      const footerText = `Generated on ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
      const footerWidth = doc.getTextWidth(footerText);
      doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 10);

      // Save the PDF
      const filename = `${timetable?.className || 'timetable'}_${new Date().getTime()}.pdf`;
      doc.save(filename);
      
      toast.dismiss(loadingToast);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.dismiss(loadingToast);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  const getCellByDayAndPeriod = (day, period) => {
    if (!Array.isArray(cells)) return null;
    return cells.find((cell) => cell?.day === day && cell?.period === period) || null;
  };

  const getDepartmentColor = (dept) => {
    const colors = {
      NONE: 'bg-slate-100 text-slate-700 border-slate-300',
      CS: 'bg-blue-100 text-blue-700 border-blue-300',
      ECE: 'bg-purple-100 text-purple-700 border-purple-300',
      IT: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      MNC: 'bg-orange-100 text-orange-700 border-orange-300',
      ML: 'bg-pink-100 text-pink-700 border-pink-300',
    };
    return colors[dept] || colors.NONE;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-700 font-semibold text-base sm:text-lg mt-4">Loading timetable...</p>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Please wait</p>
        </motion.div>
      </div>
    );
  }

  if (!timetable) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 p-8 sm:p-12 max-w-md w-full"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-100 to-red-50 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Timetable Not Found</h2>
          <p className="text-slate-600 mb-6 leading-relaxed text-sm sm:text-base">The requested timetable does not exist or has been removed.</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Mobile Layout */}
          <div className="flex flex-col gap-3 sm:hidden">
            {/* Row 1: Back button and title */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-slate-900 truncate flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="truncate">{timetable.className || 'Timetable'}</span>
                </h1>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {Array.isArray(timetable.days) ? timetable.days.length : 0} days
                  </span>
                  <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {timetable.periodsPerDay || 0} periods
                  </span>
                </div>
              </div>
            </div>
            
            {/* Row 2: Export button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={exportToPDF}
              disabled={exportingPDF}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {exportingPDF ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF
                </>
              )}
            </motion.button>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="truncate">{timetable.className || 'Timetable'}</span>
                </h1>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-lg bg-primary-100 flex items-center justify-center">
                      <svg className="w-3 h-3 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    Room {timetable.roomName || 'N/A'}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {Array.isArray(timetable.days) ? timetable.days.length : 0} days
                  </span>
                  <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {timetable.periodsPerDay || 0} periods
                  </span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportToPDF}
              disabled={exportingPDF}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportingPDF ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Timetable Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        >
          {/* Table Header Banner */}
          <div className="relative bg-gradient-to-br from-primary-600 via-primary-600 to-primary-700 text-white px-4 sm:px-8 py-6 sm:py-10">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-48 sm:w-96 h-48 sm:h-96 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 sm:w-96 h-48 sm:h-96 bg-primary-800 rounded-full blur-3xl"></div>
            </div>
            <div className="relative text-center">
              <h2 className="text-xl sm:text-3xl font-bold mb-2">{timetable.className || 'Timetable'}</h2>
              <p className="text-primary-100 text-xs sm:text-sm uppercase tracking-wider font-semibold">Academic Schedule • Room {timetable.roomName || 'N/A'}</p>
            </div>
          </div>

          {/* Responsive Table Container */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-b from-slate-50 to-slate-100">
                    <th className="sticky left-0 z-20 px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-b-2 border-slate-300 bg-slate-50 min-w-[100px] sm:min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
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
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-xs">Period {i + 1}</span>
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
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0">
                            {day.substring(0, 3).toUpperCase()}
                          </div>
                          <span className="text-sm hidden sm:inline">{day}</span>
                        </div>
                      </td>
                      {Array.from({ length: timetable.periodsPerDay || 0 }, (_, i) => {
                        const period = i + 1;
                        const cell = getCellByDayAndPeriod(day, period);
                        const isEditing = editingCell?.id === cell?._id;
                        const canEdit = cell && canEditCell(cell);
                        const isLocked = cell && !canEdit;
                        const hasContent = cell?.subject && cell.subject.trim() !== '' && cell.subject !== 'Empty';

                        return (
                          <td key={`${day}-${period}`} className="px-2 sm:px-3 py-2 sm:py-3 border-b border-slate-200 align-top min-w-[140px] sm:min-w-[180px]">
                            <motion.div
                              whileHover={canEdit && !isEditing ? { scale: 1.01 } : {}}
                              onClick={() => cell && !isEditing && handleCellClick(cell)}
                              className={`min-h-[90px] sm:min-h-[110px] p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all relative ${
                                isEditing
                                  ? 'border-primary-400 bg-gradient-to-br from-primary-50 to-white shadow-lg ring-2 ring-primary-200'
                                  : canEdit
                                  ? 'border-slate-200 hover:border-primary-300 hover:shadow-md cursor-pointer bg-white'
                                  : isLocked
                                  ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                                  : 'border-dashed border-slate-300 bg-slate-50'
                              }`}
                            >
                              {isEditing ? (
                                <div className="space-y-2 sm:space-y-3">
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">Subject</label>
                                    <input
                                      type="text"
                                      value={editingCell.subject}
                                      onChange={(e) =>
                                        setEditingCell({ ...editingCell, subject: e.target.value })
                                      }
                                      className="w-full px-3 py-2 text-xs sm:text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                      placeholder="Enter subject"
                                      autoFocus
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">Dept</label>
                                    <select
                                      value={editingCell.department}
                                      onChange={(e) =>
                                        setEditingCell({ ...editingCell, department: e.target.value })
                                      }
                                      className="w-full px-3 py-2 text-xs sm:text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                    >
                                      {departments.map((dept) => (
                                        <option key={dept} value={dept}>{dept}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex gap-2 pt-1">
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveCell();
                                      }}
                                      className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-md flex items-center justify-center gap-1.5"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Save
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingCell(null);
                                      }}
                                      className="flex-1 bg-gradient-to-r from-slate-500 to-slate-600 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-md flex items-center justify-center gap-1.5"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      Cancel
                                    </motion.button>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-full flex flex-col justify-between">
                                  <div>
                                    {isLocked && (
                                      <div className="absolute top-2 right-2">
                                        <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center">
                                          <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                          </svg>
                                        </div>
                                      </div>
                                    )}
                                    <div className="text-sm font-bold text-slate-900 mb-2 pr-8 leading-tight">
                                      {cell?.subject || (
                                        <span className="text-slate-400 italic flex items-center gap-1.5 font-medium text-xs">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                          </svg>
                                          Empty
                                        </span>
                                      )}
                                    </div>
                                    {cell?.department && cell.department !== 'NONE' && (
                                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold border-2 ${getDepartmentColor(cell.department)} shadow-sm`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                        {cell.department}
                                      </span>
                                    )}
                                  </div>
                                  {hasContent && (
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleShowHistory(cell);
                                      }}
                                      className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg text-xs font-semibold shadow-md"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
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
          </div>

          {/* Legend */}
          <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-8 py-4 sm:py-6">
            <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2 uppercase">
              <div className="w-5 h-5 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Department Legend
            </h3>
            <div className="flex flex-wrap gap-2">
              {departments.filter(d => d !== 'NONE').map((dept) => (
                <span
                  key={dept}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${getDepartmentColor(dept)} shadow-sm`}
                >
                  <div className="w-2 h-2 rounded-full bg-current"></div>
                  {dept}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <CellHistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedCell(null);
        }}
        cell={selectedCell}
      />
    </div>
  );
};

export default TimetableView;