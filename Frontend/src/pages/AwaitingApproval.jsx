import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AwaitingApproval = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md relative z-10"
      >
        {/* Main Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden"
        >
          {/* Header Section with Gradient */}
          <div className="relative bg-gradient-to-br from-primary-600 via-primary-600 to-primary-700 px-8 pt-10 pb-8">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary-800/30 rounded-full blur-3xl"></div>
            
            <div className="relative text-center">
              {/* Animated Icon with pulsing rings */}
              <div className="relative w-20 h-20 mx-auto mb-5">
                {/* Pulsing rings */}
                <motion.div
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.4, 0, 0.4],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-white/30 rounded-2xl"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.4, 0, 0.4],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.8
                  }}
                  className="absolute inset-0 bg-white/20 rounded-2xl"
                />
                
                {/* Main icon */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl border border-white/30"
                >
                  <motion.svg
                    animate={{ rotate: -360 }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </motion.svg>
                </motion.div>
              </div>

              {/* Title */}
              <motion.h1
                variants={itemVariants}
                className="text-3xl font-bold text-white mb-2 tracking-tight"
              >
                Awaiting Approval
              </motion.h1>
              <motion.p variants={itemVariants} className="text-primary-100 text-sm font-medium">
                Your account is under review
              </motion.p>
            </div>
          </div>

          {/* Content Section */}
          <div className="px-8 pt-8 pb-8">
            {/* Main message */}
            <motion.p
              variants={itemVariants}
              className="text-slate-600 text-center leading-relaxed mb-6"
            >
              Your account is currently under review by our administrative team. You'll be notified once your access is granted.
            </motion.p>

            {/* Info box */}
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-r from-primary-50 to-primary-50/50 border-2 border-primary-100 rounded-xl p-4 mb-6"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 bg-primary-100 rounded-lg flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3 h-3 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-primary-900 mb-1">
                    What happens next?
                  </p>
                  <p className="text-sm text-primary-700">
                    You'll receive an email notification once your access has been approved. This typically takes 24-48 hours.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Animated status indicator */}
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-3 mb-8 py-4 px-6 bg-slate-50 rounded-xl border-2 border-slate-200"
            >
              <span className="text-sm font-semibold text-slate-700">Processing</span>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                    className="w-2 h-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                  />
                ))}
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              variants={itemVariants}
              className="space-y-3"
            >
              <motion.button
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleLogout}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold py-4 rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-200 relative overflow-hidden group"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                
                <span className="relative flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Login
                </span>
              </motion.button>

              <button
                onClick={() => window.location.reload()}
                className="w-full py-3.5 px-6 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200 border-2 border-slate-200"
              >
                Check Status
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Info */}
        <motion.div
          variants={itemVariants}
          className="mt-6 text-center"
        >
          <p className="text-sm text-slate-600 bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-sm border border-slate-200/60">
            Questions about your account?{' '}
            <span className="text-primary-600 font-semibold">
              Contact your administrator
            </span>
          </p>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          variants={itemVariants}
          className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="font-medium">Secure</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300"></div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Pending Review</span>
          </div>
        </motion.div>
      </motion.div>

      {/* CSS for blob animation */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default AwaitingApproval;