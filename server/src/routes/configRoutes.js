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

    const doctors = await User.find({ role: ROLES.DOCTOR, isActive: true }).select('name email phone');
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

module.exports = router;
