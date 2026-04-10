import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { timetableAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Feature 3 — inline progress bar
const ProgressBar = ({ filled = 0, total = 0 }) => {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const color = pct === 100 ? 'bg-emerald-500' : pct >= 67 ? 'bg-blue-500' : pct >= 34 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
        <span>{filled}/{total} cells filled</span>
        <span className={`font-bold ${pct === 100 ? 'text-emerald-600' : pct >= 67 ? 'text-blue-600' : pct >= 34 ? 'text-amber-600' : 'text-red-500'}`}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const { user, permissions } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchTimetables(); }, []);

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      const res = await timetableAPI.getAll();
      const data = res?.data?.data;
      setTimetables(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to fetch timetables');
      setTimetables([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = timetables.filter(t =>
    t?.roomName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: .05 } } };
  const itemV = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: .3, ease: 'easeOut' } } };

  const isDepartmentAdmin = user?.role === 'DEPARTMENT_ADMIN';

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <motion.div initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-slate-600 font-medium">Loading timetables...</p>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {isDepartmentAdmin ? `${user?.department} Department` : 'Timetables'}
                  </h1>
                  <p className="text-xs text-slate-500">
                    {isDepartmentAdmin ? 'Browse and edit your department cells' : 'View all room schedules'}
                  </p>
                </div>
              </div>
            </motion.div>
            {!permissions.isSuperAdmin && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Only
              </div>
            )}
          </div>

          {/* Search + view toggle */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}
            className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input type="text" placeholder="Search by room name..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <svg className="w-5 h-5 text-slate-400 hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              {['grid', 'list'].map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${viewMode === mode
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}>
                  {mode === 'grid'
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  }
                  <span className="hidden sm:inline capitalize">{mode}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {timetables.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 }}
              className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                <span className="font-semibold text-primary-900">{filtered.length} timetable{filtered.length !== 1 ? 's' : ''}</span>
              </div>
              {searchQuery && <span className="text-slate-500 text-xs">filtered from {timetables.length} total</span>}
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
            <div className="max-w-sm mx-auto">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: .1 }}
                className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {searchQuery ? 'No matching timetables' : 'No timetables available'}
              </h2>
              <p className="text-slate-500 text-sm">
                {searchQuery ? 'Try a different room name' : 'Timetables will appear here once created by the Super Admin'}
              </p>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div key="grid" variants={containerV} initial="hidden" animate="visible" exit="hidden"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filtered.map(t => !t?._id ? null : (
                  <motion.div key={t._id} variants={itemV} whileHover={{ y: -6, scale: 1.02 }}
                    className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/timetable/${t._id}`)}>
                    {/* Card header */}
                    <div className="h-20 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-4">
                      <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-md">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    {/* Card body */}
                    <div className="p-4">
                      <h3 className="text-base font-bold text-slate-900 mb-3 truncate">{t.roomName || 'Unknown Room'}</h3>
                      {/* Feature 3 — progress bar */}
                      <ProgressBar filled={t.filledCells || 0} total={t.totalCells || 0} />
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                          <span><span className="font-semibold text-slate-900">{Array.isArray(t.days) ? t.days.length : 0}</span> days</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <span><span className="font-semibold text-slate-900">{t.periodsPerDay || 0}</span> periods/day</span>
                        </div>
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </span>
                        <div className="flex items-center gap-1 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs font-semibold">Open</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div key="list" variants={containerV} initial="hidden" animate="visible" exit="hidden" className="space-y-3">
                {filtered.map(t => !t?._id ? null : (
                  <motion.div key={t._id} variants={itemV} whileHover={{ x: 4, scale: 1.005 }}
                    className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/timetable/${t._id}`)}>
                    <div className="flex items-center gap-4 p-4 sm:p-5">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-base truncate mb-1">{t.roomName || 'Unknown Room'}</h3>
                        {/* Feature 3 — progress bar in list mode */}
                        <ProgressBar filled={t.filledCells || 0} total={t.totalCells || 0} />
                        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                          <span><span className="font-semibold text-slate-700">{Array.isArray(t.days) ? t.days.length : 0}</span> days</span>
                          <span><span className="font-semibold text-slate-700">{t.periodsPerDay || 0}</span> periods</span>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;