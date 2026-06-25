const mongoose = require('mongoose');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const MedicineReminder = require('../models/MedicineReminder');
const ReminderAdherence = require('../models/ReminderAdherence');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const DoctorPatient = require('../models/DoctorPatient');
const DoctorProfile = require('../models/DoctorProfile');
const { ROLES, APPOINTMENT_STATUS, PRESCRIPTION_STATUS, REMINDER_STATUS, CONVERSATION_STATUS } = require('../config/constants');

const getDateRange = (range) => {
  const now = new Date();
  const days = range === '7d' ? 7 : range === '90d' ? 90 : range === '365d' ? 365 : 30;
  const start = new Date(now); start.setDate(start.getDate() - days); start.setHours(0, 0, 0, 0);
  return { start, end: now, days };
};

const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const todayEnd = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; };

// ═══════════════════════════════════════════════════════════════════════════════
// 1. OVERVIEW — real-time KPIs
// ═══════════════════════════════════════════════════════════════════════════════
const getOverview = async (orgId) => {
  const t = today(), te = todayEnd();
  const [
    totalDoctors, activeDoctors, pendingApprovals, totalPatients,
    totalAppointments, todayAppointments, totalPrescriptions,
    activePrescriptions, todayMessages, todayReminders, remindersSent,
    activeConversations,
  ] = await Promise.all([
    User.countDocuments({ organizationId: orgId, role: ROLES.DOCTOR }),
    User.countDocuments({ organizationId: orgId, role: ROLES.DOCTOR, isActive: true, approvalStatus: 'approved' }),
    User.countDocuments({ organizationId: orgId, role: ROLES.DOCTOR, approvalStatus: 'pending_approval' }),
    Patient.countDocuments({ organizationId: orgId }),
    Appointment.countDocuments({ organizationId: orgId }),
    Appointment.countDocuments({ organizationId: orgId, dateTime: { $gte: t, $lte: te } }),
    Prescription.countDocuments({ organizationId: orgId }),
    Prescription.countDocuments({ organizationId: orgId, status: PRESCRIPTION_STATUS.ACTIVE }),
    Message.countDocuments({ createdAt: { $gte: t } }),
    MedicineReminder.countDocuments({ organizationId: orgId, scheduledAt: { $gte: t, $lte: te } }),
    MedicineReminder.countDocuments({ organizationId: orgId, scheduledAt: { $gte: t, $lte: te }, status: REMINDER_STATUS.SENT }),
    Conversation.countDocuments({ organizationId: orgId, status: { $in: ['open', 'active', 'ai_handling', 'doctor_handling'] } }),
  ]);

  return {
    totalDoctors, activeDoctors, pendingApprovals, totalPatients,
    totalAppointments, todayAppointments, totalPrescriptions, activePrescriptions,
    todayMessages, todayReminders, remindersSent, activeConversations,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. GROWTH
// ═══════════════════════════════════════════════════════════════════════════════
const getGrowth = async (orgId, range = '30d') => {
  const { start, days } = getDateRange(range);
  const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - days);

  const [doctorsGrowth, patientsGrowth, prevDoctors, prevPatients, approvalStats, avgApprovalTime] = await Promise.all([
    User.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(orgId), role: ROLES.DOCTOR, createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Patient.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(orgId), createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    User.countDocuments({ organizationId: orgId, role: ROLES.DOCTOR, createdAt: { $gte: prevStart, $lt: start } }),
    Patient.countDocuments({ organizationId: orgId, createdAt: { $gte: prevStart, $lt: start } }),
    User.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(orgId), role: ROLES.DOCTOR, approvalStatus: { $in: ['approved', 'rejected'] } } },
      { $group: { _id: '$approvalStatus', count: { $sum: 1 } } },
    ]),
    DoctorProfile.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(orgId), applicationStatus: 'approved', approvedAt: { $ne: null } } },
      { $project: { waitTime: { $subtract: ['$approvedAt', '$createdAt'] } } },
      { $group: { _id: null, avgMs: { $avg: '$waitTime' } } },
    ]),
  ]);

  const currentDoctorCount = doctorsGrowth.reduce((s, d) => s + d.count, 0);
  const currentPatientCount = patientsGrowth.reduce((s, d) => s + d.count, 0);

  return {
    doctorsGrowth, patientsGrowth,
    doctorsChange: prevDoctors ? Math.round(((currentDoctorCount - prevDoctors) / prevDoctors) * 100) : 100,
    patientsChange: prevPatients ? Math.round(((currentPatientCount - prevPatients) / prevPatients) * 100) : 100,
    approvalStats: approvalStats.reduce((o, s) => ({ ...o, [s._id]: s.count }), {}),
    avgApprovalTimeHours: avgApprovalTime[0] ? Math.round(avgApprovalTime[0].avgMs / 3600000) : null,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. APPOINTMENTS
// ═══════════════════════════════════════════════════════════════════════════════
const getAppointmentAnalytics = async (orgId, range = '30d') => {
  const { start } = getDateRange(range);
  const orgObjId = new mongoose.Types.ObjectId(orgId);

  const [trend, statusBreakdown, typeBreakdown, heatmap, avgWait, cancellationReasons] = await Promise.all([
    Appointment.aggregate([
      { $match: { organizationId: orgObjId, dateTime: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$dateTime' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Appointment.aggregate([
      { $match: { organizationId: orgObjId, dateTime: { $gte: start } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Appointment.aggregate([
      { $match: { organizationId: orgObjId, dateTime: { $gte: start } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    Appointment.aggregate([
      { $match: { organizationId: orgObjId, dateTime: { $gte: start } } },
      { $project: { hour: { $hour: '$dateTime' }, dayOfWeek: { $dayOfWeek: '$dateTime' } } },
      { $group: { _id: { hour: '$hour', day: '$dayOfWeek' }, count: { $sum: 1 } } },
    ]),
    Appointment.aggregate([
      { $match: { organizationId: orgObjId, dateTime: { $gte: start } } },
      { $project: { waitDays: { $divide: [{ $subtract: ['$dateTime', '$createdAt'] }, 86400000] } } },
      { $group: { _id: null, avg: { $avg: '$waitDays' } } },
    ]),
    Appointment.aggregate([
      { $match: { organizationId: orgObjId, status: APPOINTMENT_STATUS.CANCELLED, dateTime: { $gte: start } } },
      { $group: { _id: '$cancellationReason', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 10 },
    ]),
  ]);

  const total = statusBreakdown.reduce((s, d) => s + d.count, 0);
  const completed = statusBreakdown.find(s => s._id === APPOINTMENT_STATUS.COMPLETED)?.count || 0;
  const cancelled = statusBreakdown.find(s => s._id === APPOINTMENT_STATUS.CANCELLED)?.count || 0;
  const noShow = statusBreakdown.find(s => s._id === APPOINTMENT_STATUS.NO_SHOW)?.count || 0;

  return {
    trend, statusBreakdown, typeBreakdown, heatmap, cancellationReasons,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
    cancellationRate: total ? Math.round((cancelled / total) * 100) : 0,
    noShowRate: total ? Math.round((noShow / total) * 100) : 0,
    avgWaitDays: avgWait[0] ? Math.round(avgWait[0].avg * 10) / 10 : 0,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PRESCRIPTIONS & ADHERENCE
// ═══════════════════════════════════════════════════════════════════════════════
const getPrescriptionAnalytics = async (orgId, range = '30d') => {
  const { start } = getDateRange(range);
  const orgObjId = new mongoose.Types.ObjectId(orgId);

  const [trend, statusBreakdown, topMedicines, avgMedicines, adherenceOverall, adherenceTrend] = await Promise.all([
    Prescription.aggregate([
      { $match: { organizationId: orgObjId, createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Prescription.aggregate([
      { $match: { organizationId: orgObjId, createdAt: { $gte: start } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Prescription.aggregate([
      { $match: { organizationId: orgObjId, createdAt: { $gte: start } } },
      { $unwind: '$medicines' },
      { $group: { _id: '$medicines.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 15 },
    ]),
    Prescription.aggregate([
      { $match: { organizationId: orgObjId, createdAt: { $gte: start } } },
      { $project: { medCount: { $size: '$medicines' } } },
      { $group: { _id: null, avg: { $avg: '$medCount' } } },
    ]),
    ReminderAdherence.aggregate([
      { $match: { date: { $gte: start } } },
      { $group: { _id: null, avg: { $avg: '$adherencePercent' } } },
    ]),
    ReminderAdherence.aggregate([
      { $match: { date: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, avg: { $avg: '$adherencePercent' } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Reminder delivery stats
  const [reminderStats] = await MedicineReminder.aggregate([
    { $match: { organizationId: orgObjId, scheduledAt: { $gte: start } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]).then(r => [r.reduce((o, s) => ({ ...o, [s._id]: s.count }), {})]);

  const totalReminders = Object.values(reminderStats).reduce((s, v) => s + v, 0);

  return {
    trend, statusBreakdown, topMedicines,
    avgMedicinesPerPrescription: avgMedicines[0] ? Math.round(avgMedicines[0].avg * 10) / 10 : 0,
    adherenceRate: adherenceOverall[0] ? Math.round(adherenceOverall[0].avg) : 0,
    adherenceTrend,
    reminderStats: { ...reminderStats, total: totalReminders },
    missedRate: totalReminders ? Math.round(((reminderStats.missed || 0) / totalReminders) * 100) : 0,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. CHAT & ENGAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
const getChatAnalytics = async (orgId, range = '30d') => {
  const { start } = getDateRange(range);
  const orgObjId = new mongoose.Types.ObjectId(orgId);

  const [messageTrend, conversationStatus, avgResponseTime, topActiveConversations] = await Promise.all([
    Message.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Conversation.aggregate([
      { $match: { organizationId: orgObjId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    // Avg doctor response time: time between patient message and next doctor message in same convo
    Message.aggregate([
      { $match: { createdAt: { $gte: start }, senderRole: 'doctor' } },
      { $sort: { conversationId: 1, createdAt: 1 } },
      { $group: { _id: '$conversationId', firstDoctorReply: { $first: '$createdAt' } } },
      { $lookup: { from: 'messages', let: { cid: '$_id' }, pipeline: [
        { $match: { $expr: { $and: [{ $eq: ['$conversationId', '$$cid'] }, { $eq: ['$senderRole', 'patient'] }] }, createdAt: { $gte: start } } },
        { $sort: { createdAt: 1 } }, { $limit: 1 },
      ], as: 'firstPatientMsg' } },
      { $unwind: '$firstPatientMsg' },
      { $project: { responseMs: { $subtract: ['$firstDoctorReply', '$firstPatientMsg.createdAt'] } } },
      { $match: { responseMs: { $gt: 0 } } },
      { $group: { _id: null, avgMs: { $avg: '$responseMs' } } },
    ]),
    Conversation.aggregate([
      { $match: { organizationId: orgObjId, status: { $in: ['open', 'active'] } } },
      { $sort: { lastMessageAt: -1 } }, { $limit: 10 },
      { $lookup: { from: 'users', localField: 'patientId', foreignField: '_id', as: 'patient' } },
      { $lookup: { from: 'users', localField: 'doctorId', foreignField: '_id', as: 'doctor' } },
      { $unwind: '$patient' }, { $unwind: '$doctor' },
      { $project: { patientName: '$patient.name', doctorName: '$doctor.name', lastMessageAt: 1, unreadByDoctor: 1, status: 1 } },
    ]),
  ]);

  const totalConversations = conversationStatus.reduce((s, c) => s + c.count, 0);
  const resolved = conversationStatus.find(c => c._id === 'resolved')?.count || 0;

  return {
    messageTrend, conversationStatus, topActiveConversations,
    totalConversations,
    resolutionRate: totalConversations ? Math.round((resolved / totalConversations) * 100) : 0,
    avgResponseTimeMinutes: avgResponseTime[0] ? Math.round(avgResponseTime[0].avgMs / 60000) : null,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. REVENUE (future-ready, returns zeros until Phase 5)
// ═══════════════════════════════════════════════════════════════════════════════
const getRevenueAnalytics = async (orgId, range = '30d') => {
  // Placeholder — will aggregate from Payment model when Phase 5 ships.
  return {
    totalRevenue: 0,
    monthlyRevenue: [],
    revenueByType: { doctor_registration: 0, patient_subscription: 0, consultation: 0 },
    activeSubscriptions: 0,
    mrr: 0,
    failedPayments: 0,
    avgRevenuePerDoctor: 0,
    avgRevenuePerPatient: 0,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. DOCTOR PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════════
const getDoctorPerformance = async (orgId, range = '30d') => {
  const { start } = getDateRange(range);
  const orgObjId = new mongoose.Types.ObjectId(orgId);

  const doctors = await User.aggregate([
    { $match: { organizationId: orgObjId, role: ROLES.DOCTOR, isActive: true, approvalStatus: 'approved' } },
    { $lookup: { from: 'doctorprofiles', localField: '_id', foreignField: 'userId', as: 'profile' } },
    { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'doctorpatients', let: { did: '$_id' }, pipeline: [
      { $match: { $expr: { $eq: ['$doctorId', '$$did'] }, status: 'active' } },
      { $count: 'c' },
    ], as: 'patientCount' } },
    { $lookup: { from: 'appointments', let: { did: '$_id' }, pipeline: [
      { $match: { $expr: { $eq: ['$doctorId', '$$did'] }, status: APPOINTMENT_STATUS.COMPLETED, dateTime: { $gte: start } } },
      { $count: 'c' },
    ], as: 'completedAppts' } },
    { $lookup: { from: 'prescriptions', let: { did: '$_id' }, pipeline: [
      { $match: { $expr: { $eq: ['$doctorId', '$$did'] }, createdAt: { $gte: start } } },
      { $count: 'c' },
    ], as: 'prescriptionCount' } },
    { $project: {
      name: 1, email: 1,
      specialization: '$profile.specialization',
      patients: { $ifNull: [{ $arrayElemAt: ['$patientCount.c', 0] }, 0] },
      completedAppointments: { $ifNull: [{ $arrayElemAt: ['$completedAppts.c', 0] }, 0] },
      prescriptions: { $ifNull: [{ $arrayElemAt: ['$prescriptionCount.c', 0] }, 0] },
    } },
    { $sort: { completedAppointments: -1 } },
  ]);

  return doctors;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 8. SYSTEM HEALTH
// ═══════════════════════════════════════════════════════════════════════════════
const getSystemHealth = async () => {
  const dbStats = await mongoose.connection.db.stats();
  // BullMQ queue depths — attempt to check, fail gracefully
  let queueStats = {};
  try {
    const { reminderQueue, pdfQueue } = require('../queues/index');
    if (reminderQueue) {
      const waiting = await reminderQueue.getWaitingCount();
      const delayed = await reminderQueue.getDelayedCount();
      const failed = await reminderQueue.getFailedCount();
      queueStats.reminders = { waiting, delayed, failed };
    }
    if (pdfQueue) {
      queueStats.pdf = { waiting: await pdfQueue.getWaitingCount(), failed: await pdfQueue.getFailedCount() };
    }
  } catch {}

  return {
    database: { collections: dbStats.collections, dataSize: dbStats.dataSize, storageSize: dbStats.storageSize, indexes: dbStats.indexes },
    queues: queueStats,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  };
};

module.exports = { getOverview, getGrowth, getAppointmentAnalytics, getPrescriptionAnalytics, getChatAnalytics, getRevenueAnalytics, getDoctorPerformance, getSystemHealth };
