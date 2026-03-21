import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { timetableAPI } from '../services/api';
import toast from 'react-hot-toast';

const CopyTimetableModal = ({ isOpen, onClose, source, onSuccess }) => {
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading]         = useState(false);

  const handleClose = () => { setNewRoomName(''); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) { toast.error('New room name is required'); return; }
    if (newRoomName.trim() === source?.roomName)
      { toast.error('New room name must differ from the source'); return; }

    try {
      setLoading(true);
      await timetableAPI.copy(source.id, { newRoomName: newRoomName.trim() });
      toast.success(`Copied to "${newRoomName.trim()}" successfully!`);
      onSuccess?.();
      handleClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to copy timetable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Copy Timetable</h2>
                  <p className="text-indigo-100 text-xs">
                    Copying structure from <span className="font-semibold">{source?.roomName}</span>
                  </p>
                </div>
              </div>
              <button onClick={handleClose}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Info */}
              <div className="flex items-start gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-800">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  The new timetable will have the same <strong>days</strong> and{' '}
                  <strong>period count</strong> as {source?.roomName}, with all cells empty.
                </span>
              </div>

              {/* New room name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  New Room Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Room 202, Lab B"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  autoFocus
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={handleClose}
                  className="flex-1 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Copying...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>Copy Timetable</>
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

export default CopyTimetableModal;