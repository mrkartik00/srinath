const ROLES = {
  SUPER_ADMIN: 'super_admin',
  DOCTOR: 'doctor',
  ASSISTANT: 'assistant',
  PATIENT: 'patient',
};

const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

const PATIENT_SUBSCRIPTION_STATUS = {
  NONE: 'none',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

const DOCTOR_APPROVAL_STATUS = {
  NOT_APPLICABLE: 'not_applicable',
  PENDING_PAYMENT: 'pending_payment',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const DOCTOR_PATIENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

const CONVERSATION_STATUS = {
  OPEN: 'open',
  AI_HANDLING: 'ai_handling',
  ESCALATED: 'escalated',
  DOCTOR_HANDLING: 'doctor_handling',
  ACTIVE: 'active',
  RESOLVED: 'resolved',
  ARCHIVED: 'archived',
};

const MESSAGE_SENDER_ROLE = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ASSISTANT: 'assistant',
  AI: 'ai',
  SYSTEM: 'system',
};

const MESSAGE_TYPE = {
  TEXT: 'text',
  IMAGE: 'image',
  DOCUMENT: 'document',
  PRESCRIPTION_LINK: 'prescription_link',
  SYSTEM_EVENT: 'system_event',
};

const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled',
  IN_PROGRESS: 'in_progress',
};

const APPOINTMENT_TYPES = {
  IN_CLINIC: 'in_clinic',
  VIRTUAL: 'virtual',
};

const PRESCRIPTION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const REMINDER_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  ACKNOWLEDGED: 'acknowledged',
  MISSED: 'missed',
  SNOOZED: 'snoozed',
};

const MEDICINE_FREQUENCY = {
  ONCE_DAILY: 'once_daily',
  TWICE_DAILY: 'twice_daily',
  THRICE_DAILY: 'thrice_daily',
  CUSTOM: 'custom',
};

const PAYMENT_TYPE = {
  DOCTOR_REGISTRATION: 'doctor_registration',
  PATIENT_SUBSCRIPTION: 'patient_subscription',
  CONSULTATION: 'consultation',
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  CAPTURED: 'captured',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const VAULT_DOCUMENT_CATEGORY = {
  LAB_REPORT: 'lab_report',
  XRAY: 'xray',
  SCAN: 'scan',
  PRESCRIPTION: 'prescription',
  DISCHARGE_SUMMARY: 'discharge_summary',
  INSURANCE: 'insurance',
  OTHER: 'other',
};

const HEALTH_UPDATE_CATEGORY = {
  NUTRITION: 'nutrition',
  EXERCISE: 'exercise',
  MEDICATION: 'medication',
  LIFESTYLE: 'lifestyle',
  CONDITION_SPECIFIC: 'condition_specific',
};

const AUDIT_ACTIONS = {
  DOCTOR_CREATED: 'doctor.created',
  DOCTOR_DEACTIVATED: 'doctor.deactivated',
  DOCTOR_SELF_REGISTERED: 'doctor.self_registered',
  DOCTOR_APPROVED: 'doctor.approved',
  DOCTOR_REJECTED: 'doctor.rejected',
  PATIENT_CREATED: 'patient.created',
  PATIENT_ASSIGNED: 'patient.assigned',
  PRESCRIPTION_CREATED: 'prescription.created',
  PRESCRIPTION_CANCELLED: 'prescription.cancelled',
  APPOINTMENT_CREATED: 'appointment.created',
  APPOINTMENT_CANCELLED: 'appointment.cancelled',
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  SUBSCRIPTION_EXPIRED: 'subscription.expired',
  PAYMENT_CAPTURED: 'payment.captured',
  PAYMENT_FAILED: 'payment.failed',
  VAULT_UPLOADED: 'vault.uploaded',
  VAULT_ACCESSED: 'vault.accessed',
  VAULT_DELETED: 'vault.deleted',
  AI_ESCALATED: 'ai.escalated',
  CONVERSATION_ESCALATED: 'conversation.escalated',
};

const GENDERS = ['male', 'female', 'other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

module.exports = {
  ROLES,
  SUBSCRIPTION_STATUS,
  PATIENT_SUBSCRIPTION_STATUS,
  DOCTOR_APPROVAL_STATUS,
  DOCTOR_PATIENT_STATUS,
  CONVERSATION_STATUS,
  MESSAGE_SENDER_ROLE,
  MESSAGE_TYPE,
  APPOINTMENT_STATUS,
  APPOINTMENT_TYPES,
  PRESCRIPTION_STATUS,
  REMINDER_STATUS,
  MEDICINE_FREQUENCY,
  PAYMENT_TYPE,
  PAYMENT_STATUS,
  VAULT_DOCUMENT_CATEGORY,
  HEALTH_UPDATE_CATEGORY,
  AUDIT_ACTIONS,
  GENDERS,
  BLOOD_GROUPS,
  PAGINATION,
};
