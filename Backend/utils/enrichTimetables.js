const TimetableCell = require('../models/TimetableCell');

/**
 * Attach filledCells, totalCells, and (optionally) cellSummary to each timetable.
 * One aggregation covers all timetables — no N+1 queries.
 *
 * @param {Array}   timetables       lean mongoose docs
 * @param {Boolean} includeSummary   true for heatmap data (superAdmin only)
 */
const enrichWithCellStats = async (timetables, includeSummary = false) => {
  if (!timetables.length) return timetables;

  const ids = timetables.map(t => t._id);

  const groupStage = {
    _id: '$timetableId',
    filledCells: {
      $sum: {
        $cond: [
          { $and: [{ $ne: ['$subject', ''] }, { $ne: ['$subject', null] }] },
          1, 0
        ]
      }
    }
  };
  if (includeSummary) {
    groupStage.cellSummary = {
      $push: { day: '$day', period: '$period', department: '$department' }
    };
  }

  const stats = await TimetableCell.aggregate([
    { $match: { timetableId: { $in: ids }, isDeleted: { $ne: true } } },
    { $group: groupStage }
  ]);

  const statsMap = {};
  stats.forEach(s => { statsMap[s._id.toString()] = s; });

  return timetables.map(t => {
    const s = statsMap[t._id.toString()] || {};
    const enriched = {
      ...t,
      filledCells: s.filledCells || 0,
      totalCells: (Array.isArray(t.days) ? t.days.length : 0) * (t.periodsPerDay || 0)
    };
    if (includeSummary) enriched.cellSummary = s.cellSummary || [];
    return enriched;
  });
};

module.exports = { enrichWithCellStats };