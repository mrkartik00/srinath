const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const tenantScope = require('../middleware/tenantScope');
const { doctorApprovedGate, requireEmailVerified } = require('../middleware/gates');
const doctorController = require('../controllers/doctorController');
const { ROLES } = require('../config/constants');

const guard = [protect, requireEmailVerified, authorize(ROLES.DOCTOR), tenantScope, doctorApprovedGate];

router.get('/patients', ...guard, doctorController.getMyPatients);
router.post('/patients', ...guard, doctorController.addPatient);
router.get('/profile', ...guard, doctorController.getMyProfile);
router.patch('/profile', ...guard, doctorController.updateMyProfile);

const DoctorProfile = require('../models/DoctorProfile');
const DoctorReview = require('../models/DoctorReview');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');

// Testimonials CRUD
router.post('/testimonials', ...guard, asyncHandler(async (req, res) => {
  const { authorName, text, rating } = req.body;
  if (!authorName || !text) return apiResponse.error(res, 'authorName and text are required', 400);
  const profile = await DoctorProfile.findOne({ userId: req.user.id });
  if (!profile) return apiResponse.error(res, 'Profile not found', 404);
  if (profile.testimonials.length >= 20) return apiResponse.error(res, 'Maximum 20 testimonials allowed', 400);
  profile.testimonials.push({ authorName, text, rating: rating || null });
  await profile.save();
  apiResponse.success(res, profile.testimonials, 'Testimonial added', {}, 201);
}));

router.patch('/testimonials/:tid', ...guard, asyncHandler(async (req, res) => {
  const { authorName, text, rating } = req.body;
  const profile = await DoctorProfile.findOne({ userId: req.user.id });
  if (!profile) return apiResponse.error(res, 'Profile not found', 404);
  const testimonial = profile.testimonials.id(req.params.tid);
  if (!testimonial) return apiResponse.error(res, 'Testimonial not found', 404);
  if (authorName) testimonial.authorName = authorName;
  if (text) testimonial.text = text;
  if (rating !== undefined) testimonial.rating = rating;
  await profile.save();
  apiResponse.success(res, profile.testimonials, 'Testimonial updated');
}));

router.delete('/testimonials/:tid', ...guard, asyncHandler(async (req, res) => {
  const profile = await DoctorProfile.findOne({ userId: req.user.id });
  if (!profile) return apiResponse.error(res, 'Profile not found', 404);
  const testimonial = profile.testimonials.id(req.params.tid);
  if (!testimonial) return apiResponse.error(res, 'Testimonial not found', 404);
  testimonial.deleteOne();
  await profile.save();
  apiResponse.success(res, profile.testimonials, 'Testimonial deleted');
}));

// Reviews moderation (doctor views/moderates reviews about themselves)
router.get('/reviews', ...guard, asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { doctorId: req.user.id };
  if (status) filter.status = status;
  const reviews = await DoctorReview.find(filter).populate('patientId', 'name avatar').sort({ createdAt: -1 }).lean();
  apiResponse.success(res, reviews, 'Reviews fetched');
}));

router.patch('/reviews/:id/approve', ...guard, asyncHandler(async (req, res) => {
  const review = await DoctorReview.findOne({ _id: req.params.id, doctorId: req.user.id });
  if (!review) return apiResponse.error(res, 'Review not found', 404);
  review.status = 'approved';
  review.moderatedBy = req.user.id;
  review.moderatedAt = new Date();
  await review.save();
  apiResponse.success(res, review, 'Review approved');
}));

router.patch('/reviews/:id/reject', ...guard, asyncHandler(async (req, res) => {
  const review = await DoctorReview.findOne({ _id: req.params.id, doctorId: req.user.id });
  if (!review) return apiResponse.error(res, 'Review not found', 404);
  review.status = 'rejected';
  review.moderatedBy = req.user.id;
  review.moderatedAt = new Date();
  await review.save();
  apiResponse.success(res, review, 'Review rejected');
}));

module.exports = router;
