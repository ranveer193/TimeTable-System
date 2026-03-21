import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { superAdminAPI, timetableAPI } from '../services/api';
import toast from 'react-hot-toast';
import ApprovalModal      from '../components/ApprovalModal';
import CreateTimetableModal from '../components/CreateTimeTableModal';
import CopyTimetableModal from '../components/CopyTimetableModal';
import ConfirmModal       from '../components/ConfirmModal';

// ─────────────────────────────────────────────────────────────
const DEPT_MAP = {
  CS:  { color: 'text-blue-700',    bg: 'bg-blue-100',    border: 'border-blue-200'    },
  ECE: { color: 'text-purple-700',  bg: 'bg-purple-100',  border: 'border-purple-200'  },
  IT:  { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  MNC: { color: 'text-orange-700',  bg: 'bg-orange-100',  border: 'border-orange-200'  },
  ML:  { color: 'text-pink-700',    bg: 'bg-pink-100',    border: 'border-pink-200'    },
};

const HEATMAP_COLORS = {
  CS: '#3b82f6', ECE: '#8b5cf6', IT: '#10b981',
  MNC: '#f97316', ML: '#ec4899', NONE: '#e2e8f0',
};

// ─────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────
const EmptyState = ({ icon, title, description }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-12 sm:py-16 px-4"
  >
    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
      {icon}
    </div>
    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 max-w-md mx-auto">{description}</p>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
// ProgressBar
// ─────────────────────────────────────────────────────────────
const ProgressBar = ({ filled = 0, total = 0 }) => {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const color =
    pct === 100 ? 'bg-emerald-500' : pct >= 67 ? 'bg-blue-500' :
    pct >= 34   ? 'bg-amber-400'   : 'bg-red-400';
  const textColor =
    pct === 100 ? 'text-emerald-600' : pct >= 67 ? 'text-blue-600' :
    pct >= 34   ? 'text-amber-600'   : 'text-red-500';
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{filled}/{total} filled</span>
        <span className={`font-bold ${textColor}`}>{pct}%</span>
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

// ─────────────────────────────────────────────────────────────
// HeatmapGrid
// ─────────────────────────────────────────────────────────────
const HeatmapGrid = ({ days = [], periodsPerDay = 0, cellSummary = [] }) => {
  const lookup = {};
  cellSummary.forEach(c => { lookup[`${c.day}-${c.period}`] = c.department; });
  if (!days.length || !periodsPerDay) return null;
  return (
    <div className="mt-3">
      <p className="text-xs text-slate-400 font-medium mb-1.5 uppercase tracking-wide">Cell Map</p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${periodsPerDay}, 1fr)`, gap: 2 }}>
        {days.flatMap(day =>
          Array.from({ length: periodsPerDay }, (_, i) => {
            const period = i + 1;
            const dept   = lookup[`${day}-${period}`] || 'NONE';
            return (
              <div
                key={`${day}-${period}`}
                style={{
                  width: 8, height: 8, borderRadius: 2,
                  backgroundColor: HEATMAP_COLORS[dept] || HEATMAP_COLORS.NONE,
                }}
                title={`${day.slice(0, 3)} P${period}: ${dept}`}
              />
            );
          })
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {Object.entries(HEATMAP_COLORS).filter(([k]) => k !== 'NONE').map(([dept, color]) => (
          <div key={dept} className="flex items-center gap-1">
            <div style={{ width: 6, height: 6, borderRadius: 1, backgroundColor: color }} />
            <span className="text-xs text-slate-400">{dept}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon, gradient, iconBg, trend }) => (
  <motion.div
    whileHover={{ y: -6, scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 300 }}
    className="relative bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 overflow-hidden group"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
    <div className="relative flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">{title}</p>
        <h3 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-1">{value}</h3>
        {trend && <p className="text-xs text-slate-500">{trend}</p>}
      </div>
      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${iconBg} bg-gradient-to-br shadow-lg flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
    </div>
    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
// UserCard
// type: 'pending' | 'active' | 'disabled' | 'user'
// ─────────────────────────────────────────────────────────────
const UserCard = ({ user, onApprove, onReject, onToggleStatus, onDelete, type, index }) => {
  if (!user) return null;

  const di  = user?.department ? DEPT_MAP[user.department] : null;
  const bar =
    type === 'pending'  ? 'from-amber-400 to-orange-500'  :
    type === 'active'   ? 'from-emerald-400 to-green-500' :
    type === 'disabled' ? 'from-red-400 to-rose-500'      :
                          'from-slate-400 to-slate-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative group bg-gradient-to-br from-white to-slate-50 rounded-xl sm:rounded-2xl shadow-md border border-slate-200 hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${bar}`} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 gap-4">
        {/* Avatar + info */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {type === 'active' && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
            )}
            {type === 'disabled' && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            {type === 'user' && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-400 rounded-full border-2 border-white flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="font-bold text-slate-900 text-base truncate">{user?.name || 'Unknown'}</h3>
              {type === 'user' && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  Read-Only
                </span>
              )}
              {(type === 'active' || type === 'disabled') && (
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${
                  type === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {type === 'active' ? 'Active' : 'Disabled'}
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <p className="text-xs text-slate-500 truncate">{user?.email || 'No email'}</p>
              {di && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${di.bg} ${di.color} ${di.border}`}>
                  {user.department}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 w-full sm:w-auto">

          {/* Pending */}
          {type === 'pending' && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={onApprove}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Approve
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={onReject}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject
              </motion.button>
            </>
          )}

          {/* Active: Disable + Delete */}
          {type === 'active' && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={onToggleStatus}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Disable
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={onDelete}
                className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-red-500 rounded-xl transition-all group/del"
                title="Permanently delete this account"
              >
                <svg className="w-4 h-4 text-slate-500 group-hover/del:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </motion.button>
            </>
          )}

          {/* Disabled: Enable + Delete */}
          {type === 'disabled' && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={onToggleStatus}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Enable
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={onDelete}
                className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-red-500 rounded-xl transition-all group/del"
                title="Permanently delete this account"
              >
                <svg className="w-4 h-4 text-slate-500 group-hover/del:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </motion.button>
            </>
          )}

          {/* Read-only users: Delete only */}
          {type === 'user' && (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={onDelete}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-xs font-semibold shadow-md"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// TimetableCard
// ─────────────────────────────────────────────────────────────
const TimetableCard = ({ timetable, index, onDelete, onCopy }) => {
  const navigate = useNavigate();
  if (!timetable) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative group bg-gradient-to-br from-white to-slate-50 rounded-xl sm:rounded-2xl shadow-md border border-slate-200 hover:shadow-xl transition-all duration-300 overflow-hidden p-5 cursor-pointer"
      onClick={() => navigate(`/timetable/${timetable._id}`)}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />

      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
          <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={e => { e.stopPropagation(); onCopy(); }}
            className="w-9 h-9 bg-indigo-100 hover:bg-indigo-500 rounded-xl flex items-center justify-center transition-all group/cp"
            title="Copy timetable structure"
          >
            <svg className="w-4 h-4 text-indigo-600 group-hover/cp:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="w-9 h-9 bg-slate-100 hover:bg-red-500 rounded-xl flex items-center justify-center transition-all group/del"
            title="Delete timetable"
          >
            <svg className="w-4 h-4 text-slate-500 group-hover/del:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </motion.button>
        </div>
      </div>

      <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-2 truncate">
        {timetable.roomName || 'Unknown Room'}
      </h3>

      <ProgressBar filled={timetable.filledCells || 0} total={timetable.totalCells || 0} />

      <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Days</p>
            <p className="font-bold text-slate-900">{Array.isArray(timetable.days) ? timetable.days.length : 0}</p>
          </div>
        </div>
        <div className="w-px h-8 bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Periods</p>
            <p className="font-bold text-slate-900">{timetable.periodsPerDay || 0}</p>
          </div>
        </div>
      </div>

      <HeatmapGrid
        days={timetable.days || []}
        periodsPerDay={timetable.periodsPerDay || 0}
        cellSummary={timetable.cellSummary || []}
      />
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// SuperAdminDashboard
// ─────────────────────────────────────────────────────────────
const SuperAdminDashboard = () => {
  const navigate = useNavigate();

  const [stats,           setStats]           = useState({});
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeAdmins,    setActiveAdmins]    = useState([]);
  const [disabledAdmins,  setDisabledAdmins]  = useState([]);
  const [users,           setUsers]           = useState([]);
  const [timetables,      setTimetables]      = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [activeTab,       setActiveTab]       = useState('pending');
  const [selectedUser,    setSelectedUser]    = useState(null);
  const [ttSearch,        setTtSearch]        = useState('');
  const [actionLoading,   setActionLoading]   = useState(false);

  // ── Modal state ─────────────────────────────────────────────
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showCreateModal,   setShowCreateModal]   = useState(false);
  const [copySource,        setCopySource]        = useState(null);
  const [showCopyModal,     setShowCopyModal]     = useState(false);

  // Single confirm modal — drives all disable / delete / reject flows
  const [confirm, setConfirm] = useState({
    open:         false,
    title:        '',
    description:  '',
    confirmLabel: '',
    variant:      'danger',   // 'danger' | 'warning'
    onConfirm:    null,
  });

  const openConfirm = (opts) => setConfirm({ open: true, ...opts });
  const closeConfirm = () => {
    if (!actionLoading) setConfirm(c => ({ ...c, open: false }));
  };

  const filteredTimetables = timetables.filter(t =>
    t?.roomName?.toLowerCase().includes(ttSearch.toLowerCase())
  );

  useEffect(() => { fetchData(); }, []);

  // ── Data fetching ───────────────────────────────────────────
  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, pendingRes, activeRes, disabledRes, usersRes, ttRes] = await Promise.all([
        superAdminAPI.getStats().catch(()          => ({ data: { data: {} } })),
        superAdminAPI.getPendingRequests().catch(() => ({ data: { data: [] } })),
        superAdminAPI.getActiveAdmins().catch(()   => ({ data: { data: [] } })),
        superAdminAPI.getDisabledAdmins().catch(() => ({ data: { data: [] } })),
        superAdminAPI.getUsers().catch(()          => ({ data: { data: [] } })),
        superAdminAPI.getAllTimetables().catch(()  => ({ data: { data: [] } })),
      ]);
      setStats(statsRes?.data?.data || {});
      setPendingRequests(Array.isArray(pendingRes?.data?.data)  ? pendingRes.data.data  : []);
      setActiveAdmins(Array.isArray(activeRes?.data?.data)      ? activeRes.data.data   : []);
      setDisabledAdmins(Array.isArray(disabledRes?.data?.data)  ? disabledRes.data.data : []);
      setUsers(Array.isArray(usersRes?.data?.data)              ? usersRes.data.data    : []);
      setTimetables(Array.isArray(ttRes?.data?.data)            ? ttRes.data.data       : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers — open modal instead of window.confirm ────────

  const handleApprove = (user) => {
    if (!user?._id) { toast.error('Invalid user'); return; }
    setSelectedUser(user);
    setShowApprovalModal(true);
  };

  const handleReject = (id, name) => {
    openConfirm({
      title:        'Reject User',
      description:  `Permanently delete the pending registration for "${name}"? This cannot be undone.`,
      confirmLabel: 'Reject & Delete',
      variant:      'danger',
      onConfirm:    async () => {
        setActionLoading(true);
        try {
          await superAdminAPI.rejectUser(id);
          toast.success('User rejected');
          fetchData();
          setConfirm(c => ({ ...c, open: false }));
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Failed to reject');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleDisable = (id, name) => {
    openConfirm({
      title:        `Disable "${name}"?`,
      description:  "They won't be able to log in until re-enabled. Their account and all timetable data will be fully preserved.",
      confirmLabel: 'Disable',
      variant:      'warning',
      onConfirm:    async () => {
        setActionLoading(true);
        try {
          const res = await superAdminAPI.toggleAdminStatus(id);
          toast.success(res?.data?.message || 'Admin disabled');
          fetchData();
          setConfirm(c => ({ ...c, open: false }));
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Failed to disable');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleEnable = async (id) => {
    // Enable is non-destructive — no confirmation needed, fire directly
    try {
      const res = await superAdminAPI.toggleAdminStatus(id);
      toast.success(res?.data?.message || 'Admin enabled');
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to enable');
    }
  };

  const handleDeleteUser = (id, name) => {
    openConfirm({
      title:        `Delete "${name}"?`,
      description:  'This will permanently remove the account and clean up all related history. This cannot be undone.',
      confirmLabel: 'Delete Permanently',
      variant:      'danger',
      onConfirm:    async () => {
        setActionLoading(true);
        try {
          await superAdminAPI.deleteUser(id);
          toast.success(`"${name}" deleted`);
          fetchData();
          setConfirm(c => ({ ...c, open: false }));
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Failed to delete user');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleDeleteTimetable = (id, roomName) => {
    openConfirm({
      title:        `Delete "${roomName}"?`,
      description:  'All cells and activity logs for this timetable will be permanently removed.',
      confirmLabel: 'Delete Timetable',
      variant:      'danger',
      onConfirm:    async () => {
        setActionLoading(true);
        try {
          await timetableAPI.delete(id);
          toast.success('Timetable deleted');
          fetchData();
          setConfirm(c => ({ ...c, open: false }));
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Failed to delete');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleCopy = (id, roomName) => {
    setCopySource({ id, roomName });
    setShowCopyModal(true);
  };

  // ── Loading ─────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-indigo-600 mx-auto mb-4" />
        <p className="text-slate-700 font-semibold">Loading Dashboard…</p>
      </div>
    </div>
  );

  // ── Tab config ──────────────────────────────────────────────
  const tabs = [
    {
      id: 'pending', label: 'Pending', fullLabel: 'Pending Requests',
      count: pendingRequests.length,
      color: 'text-amber-600', activeBg: 'bg-amber-50', bar: 'from-amber-400 to-orange-500',
      icon: <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      id: 'active', label: 'Admins', fullLabel: 'Department Admins',
      count: activeAdmins.length,
      color: 'text-emerald-600', activeBg: 'bg-emerald-50', bar: 'from-emerald-400 to-green-500',
      icon: <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      id: 'disabled', label: 'Disabled', fullLabel: 'Disabled Admins',
      count: disabledAdmins.length,
      color: 'text-red-600', activeBg: 'bg-red-50', bar: 'from-red-400 to-rose-500',
      icon: <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
    },
    {
      id: 'users', label: 'Users', fullLabel: 'Read-Only Users',
      count: users.length,
      color: 'text-slate-600', activeBg: 'bg-slate-50', bar: 'from-slate-400 to-slate-500',
      icon: <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
    },
    {
      id: 'timetables', label: 'Timetables', fullLabel: 'Timetables',
      count: timetables.length,
      color: 'text-blue-600', activeBg: 'bg-blue-50', bar: 'from-blue-400 to-indigo-500',
      icon: <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    },
  ];

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">

      {/* ── Sticky Header ── */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Super Admin Dashboard
                </h1>
              </div>
              <p className="text-slate-500 text-sm sm:text-base ml-0 sm:ml-14">
                Manage users, timetables, and system operations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Timetable
              </motion.button>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-semibold text-emerald-700">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
          {[
            { title: 'Pending',      value: stats.pendingRequests ?? pendingRequests.length, gradient: 'from-amber-400 to-orange-500',  iconBg: 'from-amber-100 to-amber-200',    trend: 'Awaiting review',     icon: <svg className="w-5 h-5 sm:w-7 sm:h-7 text-amber-700"   fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            { title: 'Active Admins',value: stats.activeUsers    ?? activeAdmins.length,    gradient: 'from-emerald-400 to-green-500', iconBg: 'from-emerald-100 to-emerald-200', trend: 'Currently active',    icon: <svg className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            { title: 'Disabled',     value: stats.disabledUsers  ?? disabledAdmins.length,  gradient: 'from-red-400 to-rose-500',      iconBg: 'from-red-100 to-red-200',         trend: 'Access blocked',      icon: <svg className="w-5 h-5 sm:w-7 sm:h-7 text-red-700"     fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> },
            { title: 'Users',        value: stats.totalUsers     ?? users.length,           gradient: 'from-slate-400 to-slate-500',   iconBg: 'from-slate-100 to-slate-200',     trend: 'Read-only accounts',  icon: <svg className="w-5 h-5 sm:w-7 sm:h-7 text-slate-600"   fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> },
            { title: 'Timetables',   value: stats.totalTimetables ?? timetables.length,     gradient: 'from-blue-400 to-indigo-500',   iconBg: 'from-blue-100 to-blue-200',       trend: 'In the system',       icon: <svg className="w-5 h-5 sm:w-7 sm:h-7 text-blue-700"    fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
          ].map(c => <StatCard key={c.title} {...c} />)}
        </div>

        {/* Tab panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
        >
          {/* Tab nav */}
          <div className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white overflow-x-auto">
            <div className="flex gap-1 px-3 sm:px-6 py-2 min-w-max">
              {tabs.map(tab => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 sm:py-4 font-semibold text-xs sm:text-sm rounded-t-xl transition-all ${
                    activeTab === tab.id
                      ? `${tab.activeBg} ${tab.color} shadow-sm`
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className={activeTab === tab.id ? tab.color : ''}>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.fullLabel}</span>
                  <span className="sm:hidden">{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.id ? `${tab.color} bg-white` : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="saTab"
                      className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${tab.bar}`}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">

              {/* ── Pending ── */}
              {activeTab === 'pending' && (
                <motion.div key="pending" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}>
                  {!pendingRequests.length ? (
                    <EmptyState
                      title="No Pending Requests"
                      description="All requests have been processed."
                      icon={<svg className="w-12 h-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                  ) : (
                    <div className="space-y-4">
                      {pendingRequests.map((u, i) => u?._id && (
                        <UserCard
                          key={u._id} user={u} type="pending" index={i}
                          onApprove={() => handleApprove(u)}
                          onReject={() => handleReject(u._id, u.name)}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Active Admins ── */}
              {activeTab === 'active' && (
                <motion.div key="active" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-start gap-3 p-3 mb-5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      <strong>Disable</strong> blocks login temporarily — account preserved and re-enableable.{' '}
                      <strong>Delete</strong> permanently removes the account.
                    </span>
                  </div>
                  {!activeAdmins.length ? (
                    <EmptyState
                      title="No Active Admins"
                      description="There are currently no active department administrators."
                      icon={<svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    />
                  ) : (
                    <div className="space-y-4">
                      {activeAdmins.map((u, i) => u?._id && (
                        <UserCard
                          key={u._id} user={u} type="active" index={i}
                          onToggleStatus={() => handleDisable(u._id, u.name)}
                          onDelete={() => handleDeleteUser(u._id, u.name)}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Disabled Admins ── */}
              {activeTab === 'disabled' && (
                <motion.div key="disabled" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}>
                  {!disabledAdmins.length ? (
                    <EmptyState
                      title="No Disabled Admins"
                      description="All administrators are currently active."
                      icon={<svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
                    />
                  ) : (
                    <div className="space-y-4">
                      {disabledAdmins.map((u, i) => u?._id && (
                        <UserCard
                          key={u._id} user={u} type="disabled" index={i}
                          // Enable is safe — no modal needed
                          onToggleStatus={() => handleEnable(u._id)}
                          onDelete={() => handleDeleteUser(u._id, u.name)}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Read-Only Users ── */}
              {activeTab === 'users' && (
                <motion.div key="users" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-start gap-3 p-3 mb-5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>
                      These accounts can <strong>view</strong> all timetables but cannot edit any cells.
                      Delete removes the account permanently.
                    </span>
                  </div>
                  {!users.length ? (
                    <EmptyState
                      title="No Read-Only Users"
                      description="Approved users with view-only access will appear here."
                      icon={<svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                    />
                  ) : (
                    <div className="space-y-4">
                      {users.map((u, i) => u?._id && (
                        <UserCard
                          key={u._id} user={u} type="user" index={i}
                          onDelete={() => handleDeleteUser(u._id, u.name)}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Timetables ── */}
              {activeTab === 'timetables' && (
                <motion.div key="timetables" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <p className="text-sm text-slate-500 flex-shrink-0">
                      {filteredTimetables.length === timetables.length
                        ? `${timetables.length} timetable${timetables.length !== 1 ? 's' : ''} in the system`
                        : `${filteredTimetables.length} of ${timetables.length} timetables`}
                    </p>
                    <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={ttSearch}
                          onChange={e => setTtSearch(e.target.value)}
                          placeholder="Search by room name…"
                          className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                        {ttSearch && (
                          <button onClick={() => setTtSearch('')} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <svg className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold rounded-xl shadow-md text-sm flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="hidden sm:inline">New</span>
                      </motion.button>
                    </div>
                  </div>

                  {!timetables.length ? (
                    <EmptyState
                      title="No Timetables Found"
                      description="Create your first timetable using the button above."
                      icon={<svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    />
                  ) : filteredTimetables.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 px-4">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">No rooms match &ldquo;{ttSearch}&rdquo;</h3>
                      <p className="text-sm text-slate-500 mb-4">Try a different room name.</p>
                      <button onClick={() => setTtSearch('')} className="text-sm text-indigo-600 font-semibold hover:underline">Clear search</button>
                    </motion.div>
                  ) : (
                    <AnimatePresence>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredTimetables.map((tt, i) => tt?._id && (
                          <TimetableCard
                            key={tt._id} timetable={tt} index={i}
                            onDelete={() => handleDeleteTimetable(tt._id, tt.roomName)}
                            onCopy={() => handleCopy(tt._id, tt.roomName)}
                          />
                        ))}
                      </div>
                    </AnimatePresence>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ── Modals ── */}
      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => { setShowApprovalModal(false); setSelectedUser(null); }}
        user={selectedUser}
        onSuccess={() => { setShowApprovalModal(false); setSelectedUser(null); fetchData(); }}
      />
      <CreateTimetableModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => { setShowCreateModal(false); fetchData(); }}
      />
      <CopyTimetableModal
        isOpen={showCopyModal}
        onClose={() => { setShowCopyModal(false); setCopySource(null); }}
        source={copySource}
        onSuccess={() => { setShowCopyModal(false); setCopySource(null); fetchData(); }}
      />

      {/* Single shared ConfirmModal — handles disable, delete user, reject, delete timetable */}
      <ConfirmModal
        isOpen={confirm.open}
        onClose={closeConfirm}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        description={confirm.description}
        confirmLabel={confirm.confirmLabel}
        variant={confirm.variant}
        loading={actionLoading}
      />
    </div>
  );
};

export default SuperAdminDashboard;