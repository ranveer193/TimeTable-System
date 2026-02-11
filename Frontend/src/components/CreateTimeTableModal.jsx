import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { timetableAPI } from '../services/api';
import toast from 'react-hot-toast';

const CreateTimetableModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    roomName: '',
    className: '',
    days: [],
    periodsPerDay: 6,
  });
  const [loading, setLoading] = useState(false);

  const weekDays = [
    { name: 'Monday', icon: '📅', short: 'Mon' },
    { name: 'Tuesday', icon: '📅', short: 'Tue' },
    { name: 'Wednesday', icon: '📅', short: 'Wed' },
    { name: 'Thursday', icon: '📅', short: 'Thu' },
    { name: 'Friday', icon: '📅', short: 'Fri' },
    { name: 'Saturday', icon: '📅', short: 'Sat' }
  ];

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        roomName: '',
        className: '',
        days: [],
        periodsPerDay: 6,
      });
    }
  }, [isOpen]);

  const handleDayToggle = (day) => {
    if (Array.isArray(formData.days)) {
      if (formData.days.includes(day)) {
        setFormData({
          ...formData,
          days: formData.days.filter((d) => d !== day),
        });
      } else {
        setFormData({
          ...formData,
          days: [...formData.days, day],
        });
      }
    } else {
      setFormData({
        ...formData,
        days: [day],
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.roomName || !formData.roomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    if (!formData.className || !formData.className.trim()) {
      toast.error('Please enter a class name');
      return;
    }

    if (!Array.isArray(formData.days) || formData.days.length === 0) {
      toast.error('Please select at least one working day');
      return;
    }

    if (formData.periodsPerDay < 1 || formData.periodsPerDay > 20) {
      toast.error('Periods per day must be between 1 and 20');
      return;
    }

    try {
  setLoading(true);

  const response = await timetableAPI.create({
    roomName: formData.roomName.trim(),
    className: formData.className.trim(),
    days: formData.days,
    periodsPerDay: formData.periodsPerDay,
  });

  const data = response.data;   // 👈 IMPORTANT

  if (data.success) {
    toast.success(data.message || 'Timetable created successfully!');

    setFormData({
      roomName: '',
      className: '',
      days: [],
      periodsPerDay: 6,
    });

    onSuccess?.();
    onClose();
  } else {
    toast.error(data.message || 'Failed to create timetable');
  }

} catch (error) {
  console.error('Create timetable error:', error);
  toast.error(
    error?.response?.data?.message ||
    error?.message ||
    'Failed to create timetable'
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
            className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-br from-primary-600 via-primary-600 to-primary-700 text-white px-6 sm:px-8 py-6 sm:py-8">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-800 rounded-full blur-3xl"></div>
              </div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold">Create Timetable</h2>
                  <p className="text-primary-100 text-sm mt-1">Set up a new class schedule</p>
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

            {/* Form Content */}
            <form onSubmit={handleSubmit}>
              <div className="px-6 sm:px-8 py-6 overflow-y-auto max-h-[calc(90vh-280px)] space-y-6">
                {/* Room Name */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Room Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.roomName}
                    onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                    required
                    disabled={loading}
                    maxLength={100}
                    className="w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                    placeholder="e.g., Room 301, Lab A, Auditorium"
                  />
                </div>

                {/* Class Name */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Class Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    required
                    disabled={loading}
                    maxLength={100}
                    className="w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                    placeholder="e.g., CSE 3rd Year A, BCA 2nd Sem"
                  />
                </div>

                {/* Working Days */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Working Days <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {weekDays.map((day, index) => {
                      const isSelected = Array.isArray(formData.days) && formData.days.includes(day.name);
                      return (
                        <motion.button
                          key={day.name}
                          type="button"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDayToggle(day.name)}
                          disabled={loading}
                          className={`p-3 sm:p-4 rounded-xl border-2 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                            isSelected
                              ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-white shadow-lg shadow-primary-500/20 text-primary-700'
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:shadow-md'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-lg sm:text-xl">{day.icon}</span>
                            <span className="hidden sm:inline">{day.name}</span>
                            <span className="sm:hidden">{day.short}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                  {Array.isArray(formData.days) && formData.days.length > 0 && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs sm:text-sm text-slate-600 mt-3 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Selected: {formData.days.length} day{formData.days.length !== 1 ? 's' : ''}
                    </motion.p>
                  )}
                </div>

                {/* Periods Per Day */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Periods Per Day
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-base sm:text-lg font-bold shadow-md">
                      {formData.periodsPerDay}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={formData.periodsPerDay}
                    onChange={(e) =>
                      setFormData({ ...formData, periodsPerDay: parseInt(e.target.value) || 1 })
                    }
                    disabled={loading}
                    className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: `linear-gradient(to right, rgb(var(--color-primary-600) / 1) 0%, rgb(var(--color-primary-600) / 1) ${((formData.periodsPerDay - 1) / 19) * 100}%, rgb(226 232 240) ${((formData.periodsPerDay - 1) / 19) * 100}%, rgb(226 232 240) 100%)`
                    }}
                  />
                  <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                    <span className="font-medium">Min: 1</span>
                    <span className="font-medium">Max: 20</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 sm:px-8 py-5 sm:py-6 bg-gradient-to-b from-white to-slate-50 border-t border-slate-200">
                <div className="flex gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1 px-4 sm:px-6 py-3 sm:py-3.5 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm sm:text-base"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className="flex-1 px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Timetable
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateTimetableModal;