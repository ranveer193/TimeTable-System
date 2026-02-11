import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { superAdminAPI } from '../services/api';
import toast from 'react-hot-toast';
import ApprovalModal from '../components/ApprovalModal';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeAdmins, setActiveAdmins] = useState([]);
  const [disabledAdmins, setDisabledAdmins] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [statsRes, pendingRes, activeRes, disabledRes, timetableRes] = await Promise.all([
        superAdminAPI.getStats().catch(() => ({ data: { data: {} } })),
        superAdminAPI.getPendingRequests().catch(() => ({ data: { data: [] } })),
        superAdminAPI.getActiveAdmins().catch(() => ({ data: { data: [] } })),
        superAdminAPI.getDisabledAdmins().catch(() => ({ data: { data: [] } })),
        superAdminAPI.getAllTimetables().catch(() => ({ data: { data: [] } })),
      ]);

      setStats(statsRes?.data?.data || {});
      setPendingRequests(Array.isArray(pendingRes?.data?.data) ? pendingRes.data.data : []);
      setActiveAdmins(Array.isArray(activeRes?.data?.data) ? activeRes.data.data : []);
      setDisabledAdmins(Array.isArray(disabledRes?.data?.data) ? disabledRes.data.data : []);
      setTimetables(Array.isArray(timetableRes?.data?.data) ? timetableRes.data.data : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (user) => {
    if (!user?._id) {
      toast.error('Invalid user data');
      return;
    }
    setSelectedUser(user);
    setShowApprovalModal(true);
  };

  const handleReject = async (userId) => {
    if (!userId) {
      toast.error('Invalid user ID');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this user?')) return;

    try {
      await superAdminAPI.rejectUser(userId);
      toast.success('User rejected successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to reject user:', error);
      toast.error(error?.response?.data?.message || 'Failed to reject user');
    }
  };

  const handleToggleStatus = async (userId) => {
    if (!userId) {
      toast.error('Invalid user ID');
      return;
    }

    try {
      const response = await superAdminAPI.toggleAdminStatus(userId);
      toast.success(response?.data?.message || 'Admin status updated successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to update admin status:', error);
      toast.error(error?.response?.data?.message || 'Failed to update admin status');
    }
  };

  const StatCard = ({ title, value, icon, gradient, iconBg, trend }) => (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="relative bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 overflow-hidden group"
    >
      {/* Background gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1 sm:mb-2">{title}</p>
          <h3 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-1">{value}</h3>
          {trend && (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {trend}
            </p>
          )}
        </div>
        <motion.div
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.6 }}
          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${iconBg} bg-gradient-to-br shadow-lg flex items-center justify-center flex-shrink-0`}
        >
          {icon}
        </motion.div>
      </div>

      {/* Decorative bottom bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}></div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-slate-200 border-t-primary-600 mx-auto mb-4 sm:mb-6"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-transparent border-t-primary-400 animate-ping mx-auto opacity-20"></div>
          </div>
          <p className="text-slate-700 font-semibold text-base sm:text-lg">Loading Dashboard...</p>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Super Admin Dashboard
                </h1>
              </div>
              <p className="text-slate-600 text-sm sm:text-base ml-0 sm:ml-14 lg:ml-15">Manage users, monitor activity, and oversee system operations</p>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl sm:rounded-2xl border border-emerald-200"
            >
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs sm:text-sm font-semibold text-emerald-700">System Online</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-10">
          <StatCard
            title="Pending Requests"
            value={stats.pendingRequests || 0}
            gradient="from-amber-400 to-orange-500"
            iconBg="from-amber-100 to-amber-200"
            trend="Awaiting review"
            icon={
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Active Admins"
            value={stats.activeUsers || 0}
            gradient="from-emerald-400 to-green-500"
            iconBg="from-emerald-100 to-emerald-200"
            trend="Currently active"
            icon={
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Disabled Admins"
            value={stats.disabledUsers || 0}
            gradient="from-red-400 to-rose-500"
            iconBg="from-red-100 to-red-200"
            trend="Temporarily disabled"
            icon={
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            }
          />
          <StatCard
            title="Total Timetables"
            value={stats.totalTimetables || timetables.length}
            gradient="from-blue-400 to-indigo-500"
            iconBg="from-blue-100 to-blue-200"
            trend="In the system"
            icon={
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
        >
          {/* Tab Navigation */}
          <div className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white overflow-x-auto">
            <div className="flex gap-1 px-3 sm:px-6 py-2 min-w-max">
              {[
                {
                  id: 'pending',
                  label: 'Pending',
                  fullLabel: 'Pending Requests',
                  count: pendingRequests.length,
                  icon: (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  color: 'text-amber-600',
                  activeBg: 'bg-amber-50',
                },
                {
                  id: 'active',
                  label: 'Active',
                  fullLabel: 'Active Admins',
                  count: activeAdmins.length,
                  icon: (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  color: 'text-emerald-600',
                  activeBg: 'bg-emerald-50',
                },
                {
                  id: 'disabled',
                  label: 'Disabled',
                  fullLabel: 'Disabled Admins',
                  count: disabledAdmins.length,
                  icon: (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  ),
                  color: 'text-red-600',
                  activeBg: 'bg-red-50',
                },
                {
                  id: 'timetables',
                  label: 'Timetables',
                  fullLabel: 'Timetables',
                  count: timetables.length,
                  icon: (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                  color: 'text-blue-600',
                  activeBg: 'bg-blue-50',
                },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 sm:py-4 font-semibold text-xs sm:text-sm rounded-t-xl sm:rounded-t-2xl transition-all ${
                    activeTab === tab.id
                      ? `${tab.activeBg} ${tab.color} shadow-sm`
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className={activeTab === tab.id ? tab.color : ''}>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.fullLabel}</span>
                  <span className="sm:hidden">{tab.label}</span>
                  <span
                    className={`px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === tab.id
                        ? `${tab.color} bg-white`
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
                        tab.id === 'pending' ? 'from-amber-400 to-orange-500' :
                        tab.id === 'active' ? 'from-emerald-400 to-green-500' :
                        tab.id === 'disabled' ? 'from-red-400 to-rose-500' :
                        'from-blue-400 to-indigo-500'
                      }`}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'pending' && (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {!Array.isArray(pendingRequests) || pendingRequests.length === 0 ? (
                    <EmptyState
                      icon={
                        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      }
                      title="No Pending Requests"
                      description="All user requests have been processed. New requests will appear here."
                    />
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {pendingRequests.map((user, index) => {
                        if (!user?._id) return null;
                        return (
                          <UserCard
                            key={user._id}
                            user={user}
                            type="pending"
                            index={index}
                            onApprove={() => handleApprove(user)}
                            onReject={() => handleReject(user._id)}
                          />
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'active' && (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {!Array.isArray(activeAdmins) || activeAdmins.length === 0 ? (
                    <EmptyState
                      icon={
                        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      }
                      title="No Active Admins"
                      description="There are currently no active administrators in the system."
                    />
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {activeAdmins.map((user, index) => {
                        if (!user?._id) return null;
                        return (
                          <UserCard
                            key={user._id}
                            user={user}
                            type="active"
                            index={index}
                            onToggleStatus={() => handleToggleStatus(user._id)}
                          />
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'disabled' && (
                <motion.div
                  key="disabled"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {!Array.isArray(disabledAdmins) || disabledAdmins.length === 0 ? (
                    <EmptyState
                      icon={
                        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      }
                      title="No Disabled Admins"
                      description="All administrators are currently active. Disabled accounts will appear here."
                    />
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {disabledAdmins.map((user, index) => {
                        if (!user?._id) return null;
                        return (
                          <UserCard
                            key={user._id}
                            user={user}
                            type="disabled"
                            index={index}
                            onToggleStatus={() => handleToggleStatus(user._id)}
                          />
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'timetables' && (
                <motion.div
                  key="timetables"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {!Array.isArray(timetables) || timetables.length === 0 ? (
                    <EmptyState
                      icon={
                        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      }
                      title="No Timetables Found"
                      description="No timetables have been created yet. They will appear here once created."
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {timetables.map((tt, index) => {
                        if (!tt?._id) return null;
                        return (
                          <TimetableCard key={tt._id} timetable={tt} index={index} />
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSuccess={fetchData}
      />
    </div>
  );
};

const EmptyState = ({ icon, title, description }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-12 sm:py-16 px-4 sm:px-6"
  >
    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
      {icon}
    </div>
    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto">{description}</p>
  </motion.div>
);

const UserCard = ({ user, onApprove, onReject, onToggleStatus, type, index }) => {
  if (!user) return null;

  const getDepartmentInfo = (dept) => {
    const info = {
      CS: { name: 'Computer Science', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200' },
      ECE: { name: 'Electronics & Comm.', color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-200' },
      IT: { name: 'Information Tech.', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
      MNC: { name: 'Mathematics & Comp.', color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-200' },
      ML: { name: 'Machine Learning', color: 'text-pink-700', bg: 'bg-pink-100', border: 'border-pink-200' },
    };
    return info[dept] || { name: dept, color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' };
  };

  const deptInfo = user?.department ? getDepartmentInfo(user.department) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="relative group bg-gradient-to-br from-white to-slate-50 rounded-xl sm:rounded-2xl shadow-md border border-slate-200 hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Decorative gradient bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
        type === 'pending' ? 'from-amber-400 to-orange-500' :
        type === 'active' ? 'from-emerald-400 to-green-500' :
        'from-red-400 to-rose-500'
      }`}></div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 gap-4">
        <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto">
          {/* Avatar */}
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="relative flex-shrink-0"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {type === 'active' && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
            )}
            {type === 'disabled' && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </motion.div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-1 truncate">{user?.name || 'Unknown User'}</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5 truncate">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{user?.email || 'No email'}</span>
              </p>
              {deptInfo && (
                <>
                  <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></div>
                  <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-bold border ${deptInfo.bg} ${deptInfo.color} ${deptInfo.border}`}>
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="hidden sm:inline">{deptInfo.name}</span>
                    <span className="sm:hidden">{user.department}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          {type === 'pending' && (
            <>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onApprove}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg sm:rounded-xl hover:from-emerald-700 hover:to-emerald-800 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Approve
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReject}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg sm:rounded-xl hover:from-red-700 hover:to-red-800 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject
              </motion.button>
            </>
          )}

          {(type === 'active' || type === 'disabled') && (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggleStatus}
              className={`w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all ${
                type === 'active'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800'
              }`}
            >
              {type === 'active' ? (
                <>
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Disable
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Enable
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const TimetableCard = ({ timetable, index }) => {
  if (!timetable) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative group bg-gradient-to-br from-white to-slate-50 rounded-xl sm:rounded-2xl shadow-md border border-slate-200 hover:shadow-xl transition-all duration-300 overflow-hidden p-4 sm:p-6"
    >
      {/* Decorative gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>

      {/* Icon */}
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-3 sm:mb-4 shadow-sm">
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      {/* Content */}
      <div className="mb-2 sm:mb-3 flex items-center gap-2 flex-wrap">
  <h3 className="font-semibold text-slate-900 text-base sm:text-lg truncate">
    {timetable.className || 'Untitled Timetable'}
  </h3>

  <span className="text-slate-400 text-sm font-medium">
    • Room {timetable.roomName || 'N/A'}
  </span>
</div>

      
      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Days</p>
            <p className="font-bold text-slate-900">{Array.isArray(timetable.days) ? timetable.days.length : timetable.days || 0}</p>
          </div>
        </div>
        
        <div className="w-px h-8 sm:h-10 bg-slate-200"></div>
        
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Periods</p>
            <p className="font-bold text-slate-900">{timetable.periodsPerDay || 0}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SuperAdminDashboard;