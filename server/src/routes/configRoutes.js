const express = require('express');
const router = express.Router();
const { APPOINTMENT_TYPES, APPOINTMENT_STATUS, GENDERS, BLOOD_GROUPS } = require('../config/constants');
const SubscriptionPlan = require('../models/analytics/SubscriptionPlan');
const formatLabel = (str) =>
  str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

router.get('/constants', (req, res) => {
  res.json({
    success: true,
    data: {
      appointmentTypes: Object.entries(APPOINTMENT_TYPES).map(([key, value]) => ({
        key,
        value,
        label: formatLabel(value),
      })),
      appointmentStatuses: Object.entries(APPOINTMENT_STATUS).map(([key, value]) => ({
        key,
        value,
        label: formatLabel(value),
      })),
      genders: GENDERS,
      bloodGroups: BLOOD_GROUPS,
    },
  });
});

router.get('/doctors', async (req, res) => {
  try {
    const User = require('../models/User');
    const DoctorProfile = require('../models/DoctorProfile');
    const { ROLES } = require('../config/constants');

    const doctors = await User.find({ role: ROLES.DOCTOR, isActive: true }).select('name email phone avatar');
    const doctorIds = doctors.map(d => d._id);
    const profiles = await DoctorProfile.find({ userId: { $in: doctorIds } });

    const profileMap = {};
    profiles.forEach(p => { profileMap[p.userId.toString()] = p; });

    const result = doctors.map(doctor => {
      const profile = profileMap[doctor._id.toString()];
      return {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        avatar: doctor.avatar || null,
        specialty: profile ? profile.specialization : 'General Physician',
        experience: profile ? profile.experience : 0,
        qualification: profile ? profile.qualification : '',
        fee: profile ? profile.consultationFee : 0,
        clinicName: profile ? profile.clinicName : '',
        clinicAddress: profile ? profile.clinicAddress : '',
        aboutMe: profile ? profile.aboutMe : '',
        availableSlots: profile ? profile.availableSlots : [],
        timezone: profile ? profile.timezone : 'Asia/Kolkata',
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ planType: 'patient', isActive: true }).sort({ sortOrder: 1 });
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const { ROLES } = require('../config/constants');
const DoctorReview = require('../models/DoctorReview');
const { protect } = require('../middleware/auth');
const tenantScope = require('../middleware/tenantScope');
const { requireEmailVerified } = require('../middleware/gates');
const { authorize } = require('../middleware/rbac');
const DoctorProfile = require('../models/DoctorProfile');

// Patient submits a review for a doctor
router.post('/doctors/:id/reviews', protect, requireEmailVerified, authorize(ROLES.PATIENT), tenantScope, asyncHandler(async (req, res) => {
  const config = require('../config/env');
  if (!config.FEATURES.doctorReviews) return apiResponse.error(res, 'Reviews are not enabled', 403);

  const { rating, text } = req.body;
  if (!rating || rating < 1 || rating > 5) return apiResponse.error(res, 'Rating (1-5) is required', 400);

  const User = require('../models/User');
  const doctor = await User.findOne({ _id: req.params.id, role: ROLES.DOCTOR, organizationId: req.scope.organizationId, isActive: true });
  if (!doctor) return apiResponse.error(res, 'Doctor not found', 404);

  // Upsert: one review per patient per doctor
  const review = await DoctorReview.findOneAndUpdate(
    { doctorId: req.params.id, patientId: req.user.id },
    { doctorId: req.params.id, patientId: req.user.id, organizationId: req.scope.organizationId, rating, text: text || '', status: 'pending', moderatedBy: null, moderatedAt: null },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  apiResponse.success(res, review, 'Review submitted. It will be visible after doctor approval.', {}, 201);
}));

// Public doctor profile with testimonials + approved reviews + rating
router.get('/doctors/:id', asyncHandler(async (req, res) => {
  const User = require('../models/User');
  const doctor = await User.findOne({ _id: req.params.id, role: ROLES.DOCTOR, isActive: true }).select('name email phone avatar');
  if (!doctor) return apiResponse.error(res, 'Doctor not found', 404);

  const profile = await DoctorProfile.findOne({ userId: req.params.id }).select('-documents -accessLog -deletedAt').lean();
  const reviews = await DoctorReview.find({ doctorId: req.params.id, status: 'approved' }).populate('patientId', 'name avatar').sort({ createdAt: -1 }).limit(50).lean();

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;

  apiResponse.success(res, {
    doctor: { id: doctor._id, name: doctor.name, email: doctor.email, phone: doctor.phone, avatar: doctor.avatar },
    profile: profile || {},
    testimonials: profile?.testimonials || [],
    reviews,
    avgRating: avgRating ? parseFloat(avgRating) : null,
    reviewCount: reviews.length,
  }, 'Doctor profile fetched');
}));

module.exports = router;
