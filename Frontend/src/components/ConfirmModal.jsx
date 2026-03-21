import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Reusable confirmation modal.
 * Props:
 *   isOpen       — boolean
 *   onClose      — () => void
 *   onConfirm    — () => void
 *   title        — string
 *   description  — string
 *   confirmLabel — string  (default "Confirm")
 *   variant      — 'danger' | 'warning'  (controls button colour)
 *   loading      — boolean (shows spinner on confirm button)
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title        = 'Are you sure?',
  description  = '',
  confirmLabel = 'Confirm',
  variant      = 'danger',
  loading      = false,
}) => {
  const confirmStyles =
    variant === 'warning'
      ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-200'
      : 'bg-gradient-to-r from-red-600 to-red-700 shadow-red-200';

  const iconBg =
    variant === 'warning'
      ? 'bg-amber-100'
      : 'bg-red-100';

  const iconColor =
    variant === 'warning'
      ? 'text-amber-500'
      : 'text-red-500';

  const Icon =
    variant === 'warning' ? (
      /* Ban / disable icon */
      <svg className={`w-7 h-7 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ) : (
      /* Trash / delete icon */
      <svg className={`w-7 h-7 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && onClose()}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0,  scale: 0.92, y: 16  }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Top accent bar */}
            <div className={`h-1 w-full ${
              variant === 'warning'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                : 'bg-gradient-to-r from-red-500 to-rose-600'
            }`} />

            <div className="p-6">
              {/* Icon */}
              <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center mb-4 mx-auto`}>
                {Icon}
              </div>

              {/* Text */}
              <h2 className="text-lg font-bold text-slate-900 text-center mb-2">{title}</h2>
              {description && (
                <p className="text-sm text-slate-500 text-center leading-relaxed">{description}</p>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 py-2.5 px-4 ${confirmStyles} text-white font-semibold rounded-xl shadow-lg transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    confirmLabel
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

export default ConfirmModal;