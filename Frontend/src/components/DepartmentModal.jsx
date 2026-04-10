import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { departmentAPI } from '../services/api';
import toast from 'react-hot-toast';

const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', 
  '#10b981', '#84cc16', '#eab308', '#f59e0b', '#f97316', 
  '#ef4444', '#f43f5e', '#ec4899', '#d946ef', '#a855f7', 
  '#8b5cf6', '#64748b', '#78716c'
];

const DepartmentModal = ({ isOpen, onClose, department, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    color: '#6366f1'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (department) {
        setFormData({
          name: department.name || '',
          code: department.code || '',
          color: department.color || '#6366f1'
        });
      } else {
        setFormData({
          name: '',
          code: '',
          color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
        });
      }
    }
  }, [isOpen, department]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Auto-uppercase code wrapper
    setFormData(prev => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Name and code are required');
      return;
    }

    setLoading(true);
    try {
      if (department) {
        await departmentAPI.update(department._id, {
          name: formData.name,
          color: formData.color
        });
        toast.success('Department updated successfully');
      } else {
        await departmentAPI.create(formData);
        toast.success('Department created successfully');
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!loading ? onClose : undefined}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">
                {department ? 'Edit Department' : 'New Department'}
              </h2>
              <button
                onClick={onClose}
                disabled={loading}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Computer Science"
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between">
                  <span>Department Code</span>
                  {department && <span className="text-xs text-slate-400 font-normal">Cannot edit code</span>}
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g. CS"
                  required
                  maxLength={10}
                  disabled={!!department}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all uppercase disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Theme Color</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${formData.color === color ? 'border-slate-900 scale-110 shadow-sm' : 'border-transparent hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                    >
                      {formData.color === color && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.name || !formData.code}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    department ? 'Save Changes' : 'Create Department'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DepartmentModal;
