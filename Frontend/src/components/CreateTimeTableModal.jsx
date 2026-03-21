import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { timetableAPI } from '../services/api';
import toast from 'react-hot-toast';

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const CreateTimetableModal = ({ isOpen, onClose, onSuccess }) => {
  const [roomName, setRoomName] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [periodsPerDay, setPeriodsPerDay] = useState(6);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setRoomName('');
    setSelectedDays([]);
    setPeriodsPerDay(6);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const selectWeekdays = () => {
    setSelectedDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  };

  const selectAllDays = () => {
    setSelectedDays([...ALL_DAYS]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!roomName.trim()) {
      toast.error('Room name is required');
      return;
    }
    if (selectedDays.length === 0) {
      toast.error('Select at least one working day');
      return;
    }
    if (periodsPerDay < 1 || periodsPerDay > 20) {
      toast.error('Periods per day must be between 1 and 20');
      return;
    }

    try {
      setLoading(true);
      // Sort days in week order before submitting
      const ordered = ALL_DAYS.filter((d) => selectedDays.includes(d));
      await timetableAPI.create({
        roomName: roomName.trim(),
        days: ordered,
        periodsPerDay: Number(periodsPerDay),
      });
      toast.success('Timetable created successfully!');
      onSuccess?.();
      handleClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create timetable');
    } finally {
      setLoading(false);
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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Create Timetable</h2>
                    <p className="text-primary-100 text-xs">Set up a new room schedule</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Room Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Room Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Room 101, Lab A, CS Hall"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  required
                />
              </div>

              {/* Periods Per Day */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Periods Per Day <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={periodsPerDay}
                    onChange={(e) => setPeriodsPerDay(Number(e.target.value))}
                    min={1}
                    max={20}
                    className="w-28 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-center font-semibold"
                    required
                  />
                  <span className="text-sm text-slate-500">periods (1–20)</span>
                </div>
              </div>

              {/* Working Days */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Working Days <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectWeekdays}
                      className="text-xs text-primary-600 font-semibold hover:underline"
                    >
                      Mon–Fri
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={selectAllDays}
                      className="text-xs text-primary-600 font-semibold hover:underline"
                    >
                      All 6
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDays([])}
                      className="text-xs text-slate-500 font-semibold hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {ALL_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        selectedDays.includes(day)
                          ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-200'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-primary-300'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
                {selectedDays.length > 0 && (
                  <p className="text-xs text-slate-500 mt-2">
                    {selectedDays.length} day{selectedDays.length > 1 ? 's' : ''} selected ·{' '}
                    {selectedDays.length * periodsPerDay} total periods
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 px-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Timetable
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateTimetableModal;