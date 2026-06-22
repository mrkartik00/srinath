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

module.exports = router;
