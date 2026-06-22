const express = require('express');
const router = express.Router();
const { APPOINTMENT_TYPES, APPOINTMENT_STATUS, GENDERS, BLOOD_GROUPS } = require('../config/constants');

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
        specialty: profile ? profile.specialization : 'General Physician',
        experience: profile ? profile.experience : 0,
      };
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
