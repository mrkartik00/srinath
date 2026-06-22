const asyncHandler = require('../utils/asyncHandler');
const patientService = require('../services/patientService');
const doctorService = require('../services/doctorService');
const DoctorPatient = require('../models/DoctorPatient');
const apiResponse = require('../utils/apiResponse');
const { DOCTOR_PATIENT_STATUS } = require('../config/constants');

const getMyPatients = asyncHandler(async (req, res) => {
  const result = await patientService.getAll(req.query, req.scope);
  apiResponse.success(res, result.data, 'Patients fetched', result.meta);
});

const addPatient = asyncHandler(async (req, res) => {
  const { ROLES } = require('../config/constants');
  const User = require('../models/User');
  const Patient = require('../models/Patient');
  const { ConflictError } = require('../utils/apiError');

  const existing = await User.findOne({ email: req.body.email });

  let user;
  if (existing) {
    // User exists — just create the doctor-patient relationship
    user = existing;
  } else {
    // Create new user
    user = await User.create({
      name: req.body.name, email: req.body.email, password: req.body.password,
      phone: req.body.phone, role: ROLES.PATIENT, organizationId: req.scope.organizationId,
    });
  }

  // Ensure patient profile exists
  let patient = await Patient.findOne({ userId: user._id, organizationId: req.scope.organizationId });
  if (!patient) {
    patient = await Patient.create({ userId: user._id, organizationId: req.scope.organizationId, ...(req.body.profile || {}) });
  }

  // Create/reactivate doctor-patient relationship
  await DoctorPatient.findOneAndUpdate(
    { doctorId: req.user.id, patientId: user._id, organizationId: req.scope.organizationId },
    { status: DOCTOR_PATIENT_STATUS.ACTIVE, assignedAt: new Date() },
    { upsert: true }
  );

  apiResponse.success(res, { user, patient }, 'Patient added', {}, 201);
});

const getMyProfile = asyncHandler(async (req, res) => {
  const result = await doctorService.getById(req.scope.organizationId, req.user.id);
  apiResponse.success(res, result, 'Profile fetched');
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await doctorService.update(req.scope.organizationId, req.user.id, req.body);
  apiResponse.success(res, profile, 'Profile updated');
});

module.exports = { getMyPatients, addPatient, getMyProfile, updateMyProfile };
