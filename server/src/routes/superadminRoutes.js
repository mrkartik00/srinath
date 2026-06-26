const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const tenantScope = require('../middleware/tenantScope');
const c = require('../controllers/superadminController');
const { ROLES } = require('../config/constants');

const guard = [protect, authorize(ROLES.SUPER_ADMIN), tenantScope];

// Dashboard
router.get('/dashboard', ...guard, c.getDashboard);

// Doctors
router.get('/doctors', ...guard, c.getDoctors);
router.get('/doctors/:id', ...guard, c.getDoctor);
router.post('/doctors', ...guard, c.addDoctor);
router.patch('/doctors/:id', ...guard, c.updateDoctor);
router.delete('/doctors/:id', ...guard, c.deactivateDoctor);
router.patch('/doctors/:id/reactivate', ...guard, c.reactivateDoctor);
router.get('/doctors/:id/activity', ...guard, c.getDoctorActivity);

// Doctor Registrations
router.get('/registrations', ...guard, c.getRegistrations);
router.patch('/registrations/:id/approve', ...guard, c.approveDoctor);
router.patch('/registrations/:id/reject', ...guard, c.rejectDoctor);

// Patients (cross-doctor)
router.get('/patients', ...guard, c.getPatients);

// Appointments (platform-wide)
router.get('/appointments', ...guard, c.getAppointments);

// Prescriptions (platform-wide)
router.get('/prescriptions', ...guard, c.getPrescriptions);

// Analytics (comprehensive)
const analytics = require('../controllers/analyticsController');
router.get('/analytics/overview', ...guard, analytics.overview);
router.get('/analytics/growth', ...guard, analytics.growth);
router.get('/analytics/appointments', ...guard, analytics.appointments);
router.get('/analytics/prescriptions', ...guard, analytics.prescriptions);
router.get('/analytics/chat', ...guard, analytics.chat);
router.get('/analytics/revenue', ...guard, analytics.revenue);
router.get('/analytics/doctors', ...guard, analytics.doctorPerformance);
router.get('/analytics/system', ...guard, analytics.systemHealth);

// Plans
router.get('/plans', ...guard, c.getPlans);
router.get('/plans/features', ...guard, c.getPlanFeatures);
router.post('/plans', ...guard, c.createPlan);
router.patch('/plans/:id', ...guard, c.updatePlan);
router.patch('/plans/:id/toggle', ...guard, c.togglePlan);
router.delete('/plans/:id', ...guard, c.deletePlan);

// Settings
router.get('/settings', ...guard, c.getSettings);
router.post('/settings', ...guard, c.upsertSetting);

// Logs
router.get('/logs', ...guard, c.getLogs);

module.exports = router;
