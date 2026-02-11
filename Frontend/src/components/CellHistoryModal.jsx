import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CellHistoryModal = ({ isOpen, onClose, cell }) => {
  if (!cell) return null;

  const history = Array.isArray(cell.history) ? cell.history : [];
  const hasHistory = history.length > 0;

  const getDepartmentColor = (dept) => {
    const colors = {
      NONE: 'from-slate-500 to-slate-600',
      CS: 'from-blue-500 to-blue-600',
      ECE: 'from-purple-500 to-purple-600',
      IT: 'from-emerald-500 to-emerald-600',
      MNC: 'from-orange-500 to-orange-600',
      ML: 'from-pink-500 to-pink-600',
    };
    return colors[dept] || colors.NONE;
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
            onClick={onClose}
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
                  <h2 className="text-2xl sm:text-3xl font-bold">Cell History</h2>
                  <p className="text-primary-100 text-sm mt-1">Track all modifications</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 sm:px-8 py-6 overflow-y-auto max-h-[calc(90vh-220px)]">
              {/* Current Value Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-primary-50 to-white border-2 border-primary-200 rounded-2xl p-5 sm:p-6 mb-6 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-primary-900 uppercase tracking-wide">Current Value</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 truncate">{cell.subject || 'Empty'}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{cell.day || 'N/A'}</span>
                      <span className="text-slate-400">•</span>
                      <span>Period {cell.period || 'N/A'}</span>
                    </div>
                  </div>
                  {cell.department && cell.department !== 'NONE' && (
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${getDepartmentColor(cell.department)} text-white font-bold text-sm shadow-md flex-shrink-0`}>
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      {cell.department}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* History Section */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Edit History {hasHistory && `(Last ${Math.min(history.length, 2)} entries)`}
                </h3>
                
                {!hasHistory ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200"
                  >
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-slate-600 font-medium mb-1">No Edit History</p>
                    <p className="text-slate-500 text-sm">This cell hasn't been modified yet</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {history.map((entry, index) => {
                      const editorName = entry?.editedByName || 
                                        (entry?.editedBy && typeof entry.editedBy === 'object' && entry.editedBy.name) || 
                                        'Unknown';
                      const timestamp = entry?.timestamp ? new Date(entry.timestamp) : null;
                      const isValidDate = timestamp && !isNaN(timestamp.getTime());
                      const previousValue = entry?.previousValue !== undefined ? entry.previousValue : '';

                      return (
                        <motion.div
                          key={entry?._id || index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.01, x: 4 }}
                          className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4 sm:p-5 border-2 border-slate-200 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-md flex-shrink-0">
                                {editorName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
                                  {editorName}
                                </p>
                                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                                  {isValidDate 
                                    ? timestamp.toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })
                                    : 'Date unavailable'
                                  }
                                </p>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                #{history.length - index}
                              </span>
                            </div>
                          </div>
                          <div className="pl-0 sm:pl-15">
                            <div className="bg-slate-100 border-l-4 border-slate-400 rounded-lg px-4 py-3">
                              <div className="flex items-start gap-2 text-xs sm:text-sm">
                                <svg className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <span className="text-slate-600 font-medium block mb-1">Changed from:</span>
                                  <span className="font-bold text-slate-900 block truncate">
                                    {previousValue || 'Empty'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 sm:px-8 py-5 sm:py-6 bg-gradient-to-b from-white to-slate-50 border-t border-slate-200">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl font-semibold hover:from-slate-700 hover:to-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CellHistoryModal;