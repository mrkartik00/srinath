const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const DoctorPatient = require('../models/DoctorPatient');
const Conversation = require('../models/Conversation');
const { APPOINTMENT_STATUS, ROLES, DOCTOR_PATIENT_STATUS } = require('../config/constants');

const getStats = async (scope = {}) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);

  // Get patient count scoped to doctor via junction table
  let totalPatients;
  const apptFilter = { organizationId: scope.organizationId, dateTime: { $gte: today, $lte: todayEnd } };

  if (scope.doctorId) {
    const rels = await DoctorPatient.find({ doctorId: scope.doctorId, status: DOCTOR_PATIENT_STATUS.ACTIVE }).select('patientId');
    const patientUserIds = rels.map((r) => r.patientId);
    totalPatients = await Patient.countDocuments({ organizationId: scope.organizationId, userId: { $in: patientUserIds } });
    apptFilter.doctorId = scope.doctorId;
  } else {
    totalPatients = await Patient.countDocuments({ organizationId: scope.organizationId });
  }

  const [todayAppointments, completedToday, pendingToday] = await Promise.all([
    Appointment.countDocuments(apptFilter),
    Appointment.countDocuments({ ...apptFilter, status: APPOINTMENT_STATUS.COMPLETED }),
    Appointment.countDocuments({ ...apptFilter, status: APPOINTMENT_STATUS.SCHEDULED }),
  ]);

  let totalDoctors;
  if (!scope.doctorId) {
    totalDoctors = await User.countDocuments({ organizationId: scope.organizationId, role: ROLES.DOCTOR });
  }

  const upcomingFilter = { organizationId: scope.organizationId, dateTime: { $gte: today }, status: APPOINTMENT_STATUS.SCHEDULED };
  if (scope.doctorId) upcomingFilter.doctorId = scope.doctorId;

  const upcomingAppointments = await Appointment.find(upcomingFilter)
    .sort({ dateTime: 1 }).limit(5)
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
    .populate('doctorId', 'name email').lean();

  // Recent patients
  let recentFilter = { organizationId: scope.organizationId };
  if (scope.doctorId) {
    const rels = await DoctorPatient.find({ doctorId: scope.doctorId, status: DOCTOR_PATIENT_STATUS.ACTIVE }).select('patientId');
    recentFilter.userId = { $in: rels.map((r) => r.patientId) };
  }
  const recentPatients = await Patient.find(recentFilter)
    .sort({ createdAt: -1 }).limit(5)
    .populate('userId', 'name email').lean();

  // Unread chat notifications
  const unreadChatFilter = { organizationId: scope.organizationId, unreadByDoctor: { $gt: 0 } };
  if (scope.doctorId) unreadChatFilter.doctorId = scope.doctorId;
  const unreadConversations = await Conversation.find(unreadChatFilter)
    .sort({ lastMessageAt: -1 }).limit(5)
    .populate('patientId', 'name email').lean();

  return { totalPatients, totalDoctors, todayAppointments, completedToday, pendingToday, upcomingAppointments, recentPatients, unreadConversations };
};

module.exports = { getStats };
