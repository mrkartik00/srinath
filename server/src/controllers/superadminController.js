const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const DoctorProfile = require('../models/DoctorProfile');
const DoctorPatient = require('../models/DoctorPatient');
const PlatformMetrics = require('../models/analytics/PlatformMetrics');
const DoctorActivity = require('../models/analytics/DoctorActivity');
const SubscriptionPlan = require('../models/analytics/SubscriptionPlan');
const PlatformSettings = require('../models/analytics/PlatformSettings');
const SystemLog = require('../models/analytics/SystemLog');
const doctorService = require('../services/doctorService');
const paginate = require('../utils/pagination');
const { ROLES, APPOINTMENT_STATUS, DOCTOR_PATIENT_STATUS } = require('../config/constants');

// === DASHBOARD ===
const getDashboard = asyncHandler(async (req, res) => {
  const orgId = req.scope.organizationId;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);

  const [totalDoctors, totalPatients, totalAppointments, todayAppointments, totalPrescriptions, recentMetrics] = await Promise.all([
    User.countDocuments({ organizationId: orgId, role: ROLES.DOCTOR }),
    Patient.countDocuments({ organizationId: orgId }),
    Appointment.countDocuments({ organizationId: orgId }),
    Appointment.countDocuments({ organizationId: orgId, dateTime: { $gte: today, $lte: todayEnd } }),
    Prescription.countDocuments({ organizationId: orgId }),
    PlatformMetrics.find().sort({ date: -1 }).limit(30).lean(),
  ]);

  apiResponse.success(res, { totalDoctors, totalPatients, totalAppointments, todayAppointments, totalPrescriptions, recentMetrics }, 'Dashboard fetched');
});

// === DOCTORS ===
const getDoctors = asyncHandler(async (req, res) => {
  const result = await doctorService.getAll(req.scope.organizationId, req.query);
  apiResponse.success(res, result.data, 'Doctors fetched', result.meta);
});

const getDoctor = asyncHandler(async (req, res) => {
  const result = await doctorService.getById(req.scope.organizationId, req.params.id);
  const patientCount = await DoctorPatient.countDocuments({ doctorId: req.params.id, status: DOCTOR_PATIENT_STATUS.ACTIVE });
  const appointmentCount = await Appointment.countDocuments({ doctorId: req.params.id });
  const prescriptionCount = await Prescription.countDocuments({ doctorId: req.params.id });
  apiResponse.success(res, { ...result, stats: { patientCount, appointmentCount, prescriptionCount } }, 'Doctor fetched');
});

const addDoctor = asyncHandler(async (req, res) => {
  const doctor = await doctorService.addDoctor(req.scope.organizationId, req.user.id, req.body);
  await SystemLog.create({ actorId: req.user.id, actorName: req.user.email, action: 'doctor.created', target: doctor.email, details: { name: req.body.name } });
  apiResponse.success(res, doctor, 'Doctor added', {}, 201);
});

const updateDoctor = asyncHandler(async (req, res) => {
  const profile = await doctorService.update(req.scope.organizationId, req.params.id, req.body);
  apiResponse.success(res, profile, 'Doctor updated');
});

const deactivateDoctor = asyncHandler(async (req, res) => {
  await doctorService.deactivate(req.scope.organizationId, req.params.id, req.user.id);
  await SystemLog.create({ actorId: req.user.id, actorName: req.user.email, action: 'doctor.deactivated', target: req.params.id });
  apiResponse.success(res, null, 'Doctor deactivated');
});

const reactivateDoctor = asyncHandler(async (req, res) => {
  await doctorService.reactivate(req.scope.organizationId, req.params.id, req.user.id);
  await SystemLog.create({ actorId: req.user.id, actorName: req.user.email, action: 'doctor.reactivated', target: req.params.id });
  apiResponse.success(res, null, 'Doctor reactivated');
});

const getDoctorActivity = asyncHandler(async (req, res) => {
  const activity = await DoctorActivity.find({ doctorId: req.params.id }).sort({ timestamp: -1 }).limit(50).lean();
  apiResponse.success(res, activity, 'Activity fetched');
});

// === DOCTOR REGISTRATIONS ===
const getRegistrations = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { organizationId: req.scope.organizationId, role: ROLES.DOCTOR };
  if (status) filter.approvalStatus = status;
  else filter.approvalStatus = 'pending_approval';
  const doctors = await User.find(filter).sort({ createdAt: -1 }).lean();
  const profiles = await DoctorProfile.find({ userId: { $in: doctors.map(d => d._id) } }).lean();
  const result = doctors.map(d => ({ ...d, profile: profiles.find(p => p.userId.toString() === d._id.toString()) }));
  apiResponse.success(res, result, 'Registrations fetched');
});

const approveDoctor = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: ROLES.DOCTOR, organizationId: req.scope.organizationId });
  if (!user) return apiResponse.error(res, 'Doctor not found', 404);
  if (user.approvalStatus === 'approved') return apiResponse.error(res, 'Already approved', 400);
  user.isActive = true;
  user.approvalStatus = 'approved';
  await user.save({ validateBeforeSave: false });
  await DoctorProfile.findOneAndUpdate({ userId: user._id }, { applicationStatus: 'approved', approvedBy: req.user.id, approvedAt: new Date() });
  await SystemLog.create({ actorId: req.user.id, actorName: req.user.email, action: 'doctor.approved', target: user.email, details: { name: user.name } });
  apiResponse.success(res, null, 'Doctor approved');
});

const rejectDoctor = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, role: ROLES.DOCTOR, organizationId: req.scope.organizationId });
  if (!user) return apiResponse.error(res, 'Doctor not found', 404);
  user.approvalStatus = 'rejected';
  await user.save({ validateBeforeSave: false });
  await DoctorProfile.findOneAndUpdate({ userId: user._id }, { applicationStatus: 'rejected', rejectionReason: req.body.reason || 'Not specified' });
  await SystemLog.create({ actorId: req.user.id, actorName: req.user.email, action: 'doctor.rejected', target: user.email, details: { reason: req.body.reason } });
  apiResponse.success(res, null, 'Doctor rejected');
});

// === PATIENTS (cross-doctor) ===
const getPatients = asyncHandler(async (req, res) => {
  const { search, page, limit } = req.query;
  const filter = { organizationId: req.scope.organizationId };
  if (search) {
    const users = await User.find({ name: { $regex: search, $options: 'i' } }).select('_id');
    filter.userId = { $in: users.map(u => u._id) };
  }
  const result = await paginate(Patient, filter, { page, limit, populate: { path: 'userId', select: 'name email phone' } });
  apiResponse.success(res, result.data, 'Patients fetched', result.meta);
});

const addPatient = asyncHandler(async (req, res) => {
  const { name, email, phone, password, gender, bloodGroup, dateOfBirth } = req.body;
  if (!name || !email || !password) return apiResponse.error(res, 'Name, email and password are required', 400);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return apiResponse.error(res, 'A user with this email already exists', 409);

  const orgId = req.scope.organizationId;

  const user = await User.create({
    name, email: email.toLowerCase(), phone, password,
    role: ROLES.PATIENT,
    organizationId: orgId,
    isEmailVerified: true,
    registrationSource: 'admin_created',
  });

  const patient = await Patient.create({
    userId: user._id,
    organizationId: orgId,
    gender: gender || undefined,
    bloodGroup: bloodGroup || undefined,
    dateOfBirth: dateOfBirth || undefined,
  });

  apiResponse.success(res, { user: { id: user._id, name: user.name, email: user.email }, patient: patient._id }, 'Patient added successfully', {}, 201);
});

// === APPOINTMENTS (platform-wide) ===
const getAppointments = asyncHandler(async (req, res) => {
  const { status, date, page, limit } = req.query;
  const filter = { organizationId: req.scope.organizationId };
  if (status) filter.status = status;
  if (date) { const s = new Date(date); s.setHours(0,0,0,0); const e = new Date(date); e.setHours(23,59,59,999); filter.dateTime = { $gte: s, $lte: e }; }
  const result = await paginate(Appointment, filter, { page, limit, populate: [{ path: 'patientId', populate: { path: 'userId', select: 'name' } }, { path: 'doctorId', select: 'name' }] });
  apiResponse.success(res, result.data, 'Appointments fetched', result.meta);
});

// === PRESCRIPTIONS (platform-wide) ===
const getPrescriptions = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const filter = { organizationId: req.scope.organizationId };
  if (status) filter.status = status;
  const result = await paginate(Prescription, filter, { page, limit, populate: [{ path: 'patientId', populate: { path: 'userId', select: 'name' } }, { path: 'doctorId', select: 'name' }] });
  apiResponse.success(res, result.data, 'Prescriptions fetched', result.meta);
});

// === ANALYTICS ===
const getAnalytics = asyncHandler(async (req, res) => {
  const orgId = req.scope.organizationId;
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [patientGrowth, appointmentsByStatus, doctorPerformance] = await Promise.all([
    Patient.aggregate([
      { $match: { organizationId: orgId, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Appointment.aggregate([
      { $match: { organizationId: orgId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Appointment.aggregate([
      { $match: { organizationId: orgId, status: APPOINTMENT_STATUS.COMPLETED } },
      { $group: { _id: '$doctorId', completed: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'doctor' } },
      { $unwind: '$doctor' },
      { $project: { name: '$doctor.name', completed: 1 } },
      { $sort: { completed: -1 } },
      { $limit: 10 },
    ]),
  ]);

  apiResponse.success(res, { patientGrowth, appointmentsByStatus, doctorPerformance }, 'Analytics fetched');
});

// === PLANS ===
const getPlans = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.planType) filter.planType = req.query.planType;
  const plans = await SubscriptionPlan.find(filter).sort({ sortOrder: 1, price: 1 }).lean();
  apiResponse.success(res, plans, 'Plans fetched');
});

const getPlanFeatures = asyncHandler(async (req, res) => {
  const { PLAN_FEATURES } = require('../models/analytics/SubscriptionPlan');
  apiResponse.success(res, PLAN_FEATURES, 'Available features');
});

const createPlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.create(req.body);
  apiResponse.success(res, plan, 'Plan created', {}, 201);
});

const updatePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!plan) return apiResponse.error(res, 'Plan not found', 404);
  apiResponse.success(res, plan, 'Plan updated');
});

const togglePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findById(req.params.id);
  if (!plan) return apiResponse.error(res, 'Plan not found', 404);
  plan.isActive = !plan.isActive;
  await plan.save();
  apiResponse.success(res, plan, `Plan ${plan.isActive ? 'activated' : 'deactivated'}`);
});

const deletePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
  if (!plan) return apiResponse.error(res, 'Plan not found', 404);
  apiResponse.success(res, null, 'Plan deleted');
});

// === SETTINGS ===
const getSettings = asyncHandler(async (req, res) => {
  const settings = await PlatformSettings.find().lean();
  apiResponse.success(res, settings, 'Settings fetched');
});

const upsertSetting = asyncHandler(async (req, res) => {
  const { key, value, category, description } = req.body;
  const setting = await PlatformSettings.findOneAndUpdate({ key }, { value, category, description }, { upsert: true, new: true });
  apiResponse.success(res, setting, 'Setting saved');
});

// === LOGS ===
const getLogs = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await paginate(SystemLog, {}, { page, limit, sort: { timestamp: -1 } });
  apiResponse.success(res, result.data, 'Logs fetched', result.meta);
});

module.exports = {
  getDashboard, getDoctors, getDoctor, addDoctor, updateDoctor, deactivateDoctor, reactivateDoctor, getDoctorActivity,
  getRegistrations, approveDoctor, rejectDoctor,
  getPatients, addPatient, getAppointments, getPrescriptions, getAnalytics,
  getPlans, getPlanFeatures, createPlan, updatePlan, togglePlan, deletePlan,
  getSettings, upsertSetting, getLogs,
};
