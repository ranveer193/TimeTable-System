import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Safe role check
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role?.startsWith('ADMIN_');
  const isUser = user?.role === 'USER';

  const menuItems = isSuperAdmin
    ? [
        {
          path: '/dashboard',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
          label: 'Dashboard',
          badge: null,
        },
      ]
    : [
        {
          path: '/dashboard',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
          label: 'Dashboard',
          badge: null,
        },
      ];

  // Safe user data extraction
  const userName = user?.name || 'User';
  const userEmail = user?.email || 'No email';
  const userRole = user?.role ? user.role.replace(/_/g, ' ') : 'No role';
  const userDepartment = user?.department && user.department !== 'NONE' ? user.department : null;
  const userInitial = userName.charAt(0).toUpperCase();

  const getDepartmentColor = (dept) => {
    const colors = {
      CS: 'bg-blue-100 text-blue-700 border-blue-200',
      ECE: 'bg-purple-100 text-purple-700 border-purple-200',
      IT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      MNC: 'bg-orange-100 text-orange-700 border-orange-200',
      ML: 'bg-pink-100 text-pink-700 border-pink-200',
    };
    return colors[dept] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getRoleBadgeColor = (role) => {
    if (role?.includes('SUPER')) return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-400';
    if (role?.includes('ADMIN')) return 'bg-gradient-to-r from-primary-500 to-primary-600 text-white border-primary-400';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Optimized animation variants
  const sidebarVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.15,
        ease: "easeOut"
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut",
        delay: 0.05
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.1
      }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Sidebar */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sidebarVariants}
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-72'
        } bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shadow-xl relative`}
      >
        {/* Decorative gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700"></div>

        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-3"
              animate={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="w-11 h-11 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </motion.div>
              <AnimatePresence mode="wait">
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="font-bold text-slate-900 text-lg whitespace-nowrap">Timetable</h2>
                    <p className="text-xs text-slate-600 font-medium whitespace-nowrap">Management System</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Collapse Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-slate-200">
          <motion.div
            className="flex items-center gap-3"
            animate={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="relative flex-shrink-0"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {userInitial}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
            </motion.div>

            <AnimatePresence mode="wait">
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 min-w-0 overflow-hidden"
                >
                  <p className="font-bold text-slate-900 truncate text-base mb-0.5" title={userName}>
                    {userName}
                  </p>
                  <p className="text-xs text-slate-600 truncate mb-2" title={userEmail}>
                    {userEmail}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm border ${getRoleBadgeColor(user?.role)}`}>
                      {isSuperAdmin && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      )}
                      {userRole}
                    </span>
                    {userDepartment && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm ${getDepartmentColor(userDepartment)}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {userDepartment}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Navigation */}
        <motion.nav
          className="flex-1 p-4 space-y-2"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3"
              >
                Navigation
              </motion.p>
            )}
          </AnimatePresence>

          {Array.isArray(menuItems) && menuItems.map((item) => {
            if (!item || !item.path) return null;

            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                variants={staggerItem}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all relative overflow-hidden group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
                title={sidebarCollapsed ? item.label : ''}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}

                <span className={sidebarCollapsed ? 'mx-auto' : ''}>{item.icon}</span>

                <AnimatePresence mode="wait">
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="font-semibold text-sm flex-1 text-left whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {item.badge && !sidebarCollapsed && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-white/20' : 'bg-primary-100 text-primary-700'
                  }`}>
                    {item.badge}
                  </span>
                )}

                {/* Hover effect */}
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity ${isActive ? 'hidden' : ''}`}></div>
              </motion.button>
            );
          })}
        </motion.nav>

        {/* Quick Stats (if not collapsed) */}
        <AnimatePresence mode="wait">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4 border-t border-slate-200 overflow-hidden"
            >
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-4 border border-primary-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide">System Status</p>
                    <p className="text-sm font-bold text-primary-900">All Systems Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-primary-700">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="font-medium">Active & Running</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout */}
        <div className="p-4 border-t border-slate-200">
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-600 hover:bg-red-50 transition-all group relative overflow-hidden ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title={sidebarCollapsed ? 'Logout' : ''}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <AnimatePresence mode="wait">
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-semibold text-sm whitespace-nowrap"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>

            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-100 to-transparent opacity-0 group-hover:opacity-50 transition-opacity"></div>
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {children ? (
            <motion.div
              key={location.pathname}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {children}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Content Available</h3>
                <p className="text-slate-600">Please select an item from the menu to get started</p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Layout;