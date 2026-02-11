import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { superAdminAPI } from '../services/api';
import toast from 'react-hot-toast';

const ApprovalModal = ({ isOpen, onClose, user, onSuccess }) => {
  const [formData, setFormData] = useState({
    role: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'USER', label: 'Read-Only User', dept: 'NONE', icon: '👁️', color: 'from-slate-500 to-slate-600' },
    { value: 'ADMIN_CS', label: 'CS Admin', dept: 'CS', icon: '💻', color: 'from-blue-500 to-blue-600' },
    { value: 'ADMIN_ECE', label: 'ECE Admin', dept: 'ECE', icon: '⚡', color: 'from-purple-500 to-purple-600' },
    { value: 'ADMIN_IT', label: 'IT Admin', dept: 'IT', icon: '🖥️', color: 'from-emerald-500 to-emerald-600' },
    { value: 'ADMIN_MNC', label: 'MNC Admin', dept: 'MNC', icon: '📊', color: 'from-orange-500 to-orange-600' },
    { value: 'ADMIN_ML', label: 'ML Admin', dept: 'ML', icon: '🤖', color: 'from-pink-500 to-pink-600' },
  ];

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ role: '', department: '' });
    }
  }, [isOpen]);

  const handleRoleSelect = (role, dept) => {
    setFormData({ role, department: dept });
  };

  const handleApprove = async () => {
    if (!formData.role || !formData.department) {
      toast.error('Please select a role');
      return;
    }

    if (!user?._id) {
      toast.error('Invalid user data');
      return;
    }

    try {
      setLoading(true);

      const response = await superAdminAPI.approveUser(user._id, formData);
      const data = response.data;

      if (data.success) {
        toast.success(data.message || 'User approved successfully!');
        onSuccess?.();
        onClose();
      } else {
        toast.error(data.message || 'Approval failed');
      }
    } catch (error) {
      console.error('Approve user error:', error);
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to approve user'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-br from-primary-600 via-primary-600 to-primary-700 text-white px-6 sm:px-8 py-6 sm:py-8">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-800 rounded-full blur-3xl"></div>
              </div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold">Approve User</h2>
                  <p className="text-primary-100 text-sm mt-1">Assign role and department</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  disabled={loading}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 sm:px-8 py-6 overflow-y-auto max-h-[calc(90vh-220px)]">
              {/* User Info Card */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-2xl p-4 sm:p-5 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg flex-shrink-0">
                    {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate">{user?.name || 'Unknown'}</h3>
                    <p className="text-sm text-slate-600 truncate">{user?.email || 'No email'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">ID: {user?.userId || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Select Role & Department
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {Array.isArray(roles) && roles.map((role, index) => (
                    <motion.button
                      key={role.value}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRoleSelect(role.value, role.dept)}
                      disabled={loading}
                      className={`group p-4 rounded-xl sm:rounded-2xl border-2 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ${
                        formData.role === role.value
                          ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-white shadow-lg shadow-primary-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-md'
                      }`}
                    >
                      {/* Background gradient on select */}
                      {formData.role === role.value && (
                        <div className={`absolute inset-0 bg-gradient-to-r ${role.color} opacity-5`}></div>
                      )}
                      
                      <div className="relative flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white text-lg sm:text-xl shadow-md flex-shrink-0`}>
                            {role.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-sm sm:text-base">{role.label}</p>
                            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                              {role.dept === 'NONE' ? 'No Department Access' : `${role.dept} Department`}
                            </p>
                          </div>
                        </div>
                        {formData.role === role.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex-shrink-0"
                          >
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 sm:px-8 py-5 sm:py-6 bg-gradient-to-b from-white to-slate-50 border-t border-slate-200">
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 px-4 sm:px-6 py-3 sm:py-3.5 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm sm:text-base"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleApprove}
                  disabled={loading || !formData.role}
                  className="flex-1 px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Approving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve & Assign
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ApprovalModal;