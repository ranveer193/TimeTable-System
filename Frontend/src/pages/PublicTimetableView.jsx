import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicTimetable } from '../services/api';

const DEPT_COLORS = {
  CS:  'bg-blue-100 text-blue-700 border-blue-300',
  ECE: 'bg-purple-100 text-purple-700 border-purple-300',
  IT:  'bg-emerald-100 text-emerald-700 border-emerald-300',
  MNC: 'bg-orange-100 text-orange-700 border-orange-300',
  ML:  'bg-pink-100 text-pink-700 border-pink-300',
  NONE:'bg-slate-100 text-slate-600 border-slate-200',
};

const PublicTimetableView = () => {
  const { token } = useParams();
  const [timetable, setTimetable] = useState(null);
  const [cells, setCells]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    if (!token) { setError('Invalid link'); setLoading(false); return; }
    getPublicTimetable(token)
      .then(res => {
        setTimetable(res?.data?.data?.timetable || null);
        setCells(Array.isArray(res?.data?.data?.cells) ? res.data.data.cells : []);
      })
      .catch(err => {
        setError(err?.response?.data?.message || 'This timetable link is invalid or has expired.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const getCell = (day, period) =>
    cells.find(c => c.day === day && c.period === period) || null;

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Loading timetable...</p>
      </div>
    </div>
  );

  if (error || !timetable) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="text-center bg-white rounded-3xl shadow-xl border border-slate-200 p-10 max-w-sm w-full">
        <div className="w-16 h-16 bg-red-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Timetable Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <Link to="/login" className="text-primary-600 font-semibold hover:underline text-sm">
          Go to Login →
        </Link>
      </div>
    </div>
  );

  const departments = ['CS', 'ECE', 'IT', 'MNC', 'ML'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{timetable.roomName}</h1>
              <p className="text-xs text-slate-500">Academic Schedule · Read Only</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-700">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Only
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Banner */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 px-8 py-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-1">{timetable.roomName}</h2>
            <p className="text-primary-100 text-sm uppercase tracking-widest font-semibold">Academic Schedule</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="sticky left-0 z-10 px-5 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider border-b-2 border-slate-200 bg-slate-50 min-w-[120px]">
                    Day
                  </th>
                  {Array.from({ length: timetable.periodsPerDay || 0 }, (_, i) => (
                    <th key={i} className="px-4 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider border-b-2 border-slate-200 min-w-[150px]">
                      Period {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.isArray(timetable.days) && timetable.days.map((day, ri) => (
                  <tr key={day} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="sticky left-0 z-10 px-5 py-3 font-bold text-slate-800 bg-inherit border-r-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                          {day.substring(0, 3).toUpperCase()}
                        </div>
                        <span className="text-sm hidden sm:inline">{day}</span>
                      </div>
                    </td>
                    {Array.from({ length: timetable.periodsPerDay || 0 }, (_, i) => {
                      const cell = getCell(day, i + 1);
                      const hasContent = cell?.subject?.trim();
                      return (
                        <td key={`${day}-${i+1}`} className="px-3 py-2 border-b border-slate-200 align-top min-w-[150px]">
                          <div className="min-h-[70px] p-3 rounded-xl border-2 border-slate-100 bg-white">
                            <div className="text-sm font-semibold text-slate-800 mb-1.5 leading-tight">
                              {hasContent ? cell.subject : (
                                <span className="text-slate-300 italic text-xs font-normal">—</span>
                              )}
                            </div>
                            {cell?.department && cell.department !== 'NONE' && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border-2 ${DEPT_COLORS[cell.department] || DEPT_COLORS.NONE}`}>
                                <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                {cell.department}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Department Legend</p>
            <div className="flex flex-wrap gap-2">
              {departments.map(d => (
                <span key={d} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border-2 ${DEPT_COLORS[d]}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current"></div>{d}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          This is a read-only shared view. Last updated:{' '}
          {timetable.updatedAt ? new Date(timetable.updatedAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : 'N/A'}
        </p>
      </div>
    </div>
  );
};

export default PublicTimetableView;