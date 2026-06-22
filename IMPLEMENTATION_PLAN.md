# Implementation Plan — SR+ Multi-Tenant Clinical SaaS Platform

**Vision:** A SaaS platform owned by one Surgeon (Super Admin) who onboards multiple Doctors. Each Doctor pays a subscription to access the platform and serve their patients. The system provides AI-powered chat triage, digital prescriptions with automated reminders, a secure medical vault, and personalized AI health updates.

**ACID Compliance Strategy:**
- MongoDB transactions (replica set) for all multi-document writes
- Idempotency keys on all mutations (payments, prescriptions, reminders)
- Optimistic concurrency control via document versioning (`__v`)
- Event sourcing pattern for audit-critical flows (prescriptions, payments)
- Dead-letter queues for failed async jobs (reminders, notifications)
- Atomic state machines for status transitions (no invalid states possible)

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Node.js, Express, MongoDB (Replica Set) | Transactions, flexible schema |
| Queue | BullMQ + Redis | Reliable scheduling, retries, repeatable jobs |
| Real-time | Socket.IO + Redis Adapter | Scalable WebSocket, multi-instance ready |
| AI | Google Gemini 1.5 Flash | Cheap, fast, generous free tier |
| Push | Expo Push + FCM | Already on Expo; FCM for production |
| Storage | AWS S3 (presigned URLs) | Direct upload, no server proxy |
| Payments | Razorpay Subscriptions | Indian market, good docs |
| PDF | pdfkit | Lightweight, no browser needed |
| Patient Web | React + Vite + Tailwind | Fast, modern |
| Admin Dashboard | React + Vite + Tailwind | Same stack, shared components |
| Mobile App | React Native (Expo) | Cross-platform, OTA updates |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      SR+ PLATFORM                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Super Admin (Platform Owner / Surgeon)                      │
│    ├── Manages Doctors (CRUD, billing, feature access)       │
│    ├── Platform analytics & revenue dashboard                │
│    └── Global settings & plans                               │
│                                                              │
│  Doctors (Tenants — pay subscription)                        │
│    ├── Own patient base (isolated)                           │
│    ├── Prescribe → auto-generates reminders                  │
│    ├── Chat inbox (AI-triaged messages)                      │
│    ├── Appointments, vault access                            │
│    └── Assistants (optional, per-doctor)                     │
│                                                              │
│  Patients                                                    │
│    ├── Chat (AI first → doctor escalation)                   │
│    ├── Medicine reminders (daily push)                       │
│    ├── AI health updates (personalized)                      │
│    ├── Medical vault (upload/view docs)                      │
│    ├── Digital prescriptions (view/download)                 │
│    └── Book appointments                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

```
┌──────────┐   ┌──────────┐   ┌──────────┐
│  Mobile  │   │   Web    │   │  Admin   │
│  (Expo)  │   │ (React)  │   │ (React)  │
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │               │               │
     └───────────────┼───────────────┘
                     │ REST + WebSocket
                     ▼
          ┌─────────────────────┐
          │   Express Server     │
          │  /api/v1/*           │
          ├─────────────────────┤
          │ Auth │ RBAC │ Tenant │  ← Middleware layer
          ├─────────────────────┤
          │ Controllers (thin)   │
          ├─────────────────────┤
          │ Services (business)  │
          ├─────────────────────┤
          │ Models + Transactions│
          └──┬──────┬───────┬───┘
             │      │       │
        ┌────┴┐  ┌──┴──┐  ┌┴────┐
        │Mongo│  │Redis │  │ S3  │
        │(RS) │  │Queue │  │Files│
        └─────┘  └─────┘  └─────┘
```

---

## Role Hierarchy & Data Isolation

```
super_admin (1 per platform)
  └── doctor (N, each pays subscription)
       ├── assistant (optional, scoped to doctor)
       └── patient (belongs to 1+ doctors)
```

**Tenant isolation rules:**
- Every data record has `organizationId` (platform-level) + `doctorId` (tenant-level)
- Queries are ALWAYS scoped: doctor sees only their patients/prescriptions/chats
- Super Admin sees everything (cross-tenant read access)
- Patients see only their own data + their assigned doctors
- MongoDB indexes include `doctorId` for performant tenant-scoped queries

---

## ACID & Data Integrity Patterns

| Pattern | Where Applied | How |
|---------|--------------|-----|
| **Transactions** | Prescription + Reminder creation, Payment + Subscription activation | `session.startTransaction()` — all-or-nothing |
| **Idempotency** | Payment webhooks, reminder delivery, AI calls | `idempotencyKey` field, check-before-write |
| **Optimistic Locking** | Appointment booking, profile updates | `__v` version check, retry on conflict |
| **State Machines** | Appointment status, Subscription lifecycle, Conversation state | Enum + allowed transitions, reject invalid |
| **Audit Log** | Prescriptions, payments, role changes | Append-only `AuditLog` collection |
| **Soft Deletes** | Patients, Doctors, Prescriptions | `deletedAt` field, never hard-delete clinical data |
| **Dead Letter Queue** | Failed reminders, failed notifications | BullMQ DLQ, manual retry from admin |

**Valid State Transitions (examples):**
```
Appointment: scheduled → completed | cancelled | no_show
Subscription: pending → active → past_due → cancelled | active
Conversation: open → ai_handling → escalated → doctor_handling → resolved
Reminder: pending → sent → acknowledged | missed → (re-queued if missed)
```

---

## Phase 1: Multi-Tenant Foundation & Auth

**Goal:** Refactor auth to support Super Admin → Doctor → Patient hierarchy with full tenant isolation. Every API call is scoped.

### Data Models

**Organization**
```javascript
{
  name: String,           // "SR+ Clinic Platform"
  ownerId: ObjectId,      // Super Admin user
  settings: {
    maxDoctors: Number,
    defaultPlan: ObjectId,
    branding: { logo, primaryColor, clinicName }
  },
  createdAt, updatedAt
}
```

**User (updated)**
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: enum ['super_admin', 'doctor', 'assistant', 'patient'],
  organizationId: ObjectId,
  doctorId: ObjectId | null,    // which doctor this user belongs to (for assistant/patient)
  isActive: Boolean,
  isEmailVerified: Boolean,
  lastLogin: Date,
  deletedAt: Date | null,       // soft delete
  __v: Number                   // optimistic locking
}
```

**DoctorProfile**
```javascript
{
  userId: ObjectId,
  organizationId: ObjectId,
  specialization: String,
  qualification: String,
  licenseNumber: String,
  experience: Number,           // years
  consultationFee: Number,
  availableSlots: [{
    day: enum [0-6],
    startTime: String,          // "09:00"
    endTime: String             // "17:00"
  }],
  maxPatientsPerDay: Number,
  subscriptionStatus: enum ['trial', 'active', 'past_due', 'cancelled'],
  features: [String],           // enabled features based on plan
  onboardedAt: Date
}
```

**DoctorPatient (relationship)**
```javascript
{
  doctorId: ObjectId,
  patientId: ObjectId,
  organizationId: ObjectId,
  status: enum ['active', 'inactive'],
  assignedAt: Date,
  notes: String                 // doctor's private note about patient
}
```

**AuditLog**
```javascript
{
  actorId: ObjectId,
  actorRole: String,
  action: String,               // "doctor.created", "prescription.issued"
  targetType: String,           // "User", "Prescription"
  targetId: ObjectId,
  changes: Object,              // { before, after } for updates
  ipAddress: String,
  timestamp: Date
}
```

### API Endpoints

```
POST   /api/v1/auth/register          — Register (patient self-signup or invited)
POST   /api/v1/auth/login             — Login (email + password)
GET    /api/v1/auth/me                — Current user profile
POST   /api/v1/auth/refresh           — Refresh JWT token

# Super Admin only
POST   /api/v1/admin/doctors          — Add a doctor (creates user + profile)
GET    /api/v1/admin/doctors          — List all doctors (paginated)
PATCH  /api/v1/admin/doctors/:id      — Update doctor (activate/deactivate)
DELETE /api/v1/admin/doctors/:id       — Soft-delete doctor
GET    /api/v1/admin/stats            — Platform stats (doctors, patients, revenue)

# Doctor
GET    /api/v1/doctor/patients        — My patients (paginated, searchable)
POST   /api/v1/doctor/patients        — Add/invite a patient
GET    /api/v1/doctor/profile         — My profile
PATCH  /api/v1/doctor/profile         — Update profile/availability
```

### Middleware Stack

```
request → rateLimiter → auth(jwt) → tenantScope(orgId, doctorId) → rbac(roles) → validate(schema) → controller
```

`tenantScope` middleware automatically:
1. Reads `req.user.organizationId` and `req.user.doctorId`
2. Injects scoping filters into `req.scope` (used by services)
3. Prevents cross-tenant data access

### Transactions Used

- **Adding a doctor:** Create User + DoctorProfile + AuditLog in one transaction
- **Assigning patient to doctor:** Create DoctorPatient + Update User.doctorId atomically

### Acceptance Criteria

- [ ] Super Admin can add/list/deactivate doctors
- [ ] Doctor can only see their own patients (never another doctor's)
- [ ] Patient can only interact with their assigned doctor(s)
- [ ] All mutations logged in AuditLog
- [ ] Soft deletes work (deactivated doctor's data preserved)
- [ ] API versioning (/api/v1/) in place
- [ ] Transaction rollback tested (kill mid-write → no partial data)

---

## Phase 2: Digital Prescriptions & Automated Medicine Reminders

**Goal:** Doctor creates a digital prescription → system automatically generates time-based medicine reminders → patient gets push notifications daily → tracks adherence.

**ACID Focus:** Prescription + all its reminders created atomically in a transaction. Reminder delivery is idempotent (same reminder never sent twice).

### Data Models

**Prescription**
```javascript
{
  doctorId: ObjectId,
  patientId: ObjectId,
  organizationId: ObjectId,
  appointmentId: ObjectId | null,       // linked to consult if applicable
  diagnosis: String,
  medicines: [{
    name: String,
    dosage: String,                      // "500mg"
    frequency: enum ['once_daily', 'twice_daily', 'thrice_daily', 'custom'],
    timings: [String],                   // ["08:00", "20:00"]
    duration: Number,                    // days
    instructions: String,               // "after food"
    startDate: Date,
    endDate: Date                        // auto-calculated: startDate + duration
  }],
  notes: String,                         // additional doctor notes
  pdfKey: String | null,                 // S3 key for generated PDF
  status: enum ['active', 'completed', 'cancelled'],
  issuedAt: Date,
  version: Number,                       // for prescription amendments
  idempotencyKey: String,                // prevent duplicate creation
  createdAt, updatedAt
}
```

**MedicineReminder**
```javascript
{
  prescriptionId: ObjectId,
  patientId: ObjectId,
  doctorId: ObjectId,
  organizationId: ObjectId,
  medicineName: String,
  dosage: String,
  scheduledAt: Date,                     // exact datetime for this reminder
  status: enum ['pending', 'sent', 'acknowledged', 'missed', 'snoozed'],
  sentAt: Date | null,
  acknowledgedAt: Date | null,
  snoozeUntil: Date | null,
  deliveryChannel: enum ['push', 'sms', 'both'],
  deliveryAttempts: Number,
  lastAttemptAt: Date | null,
  idempotencyKey: String,                // prescriptionId + medicineName + scheduledAt hash
  createdAt
}
```

**ReminderAdherence (daily aggregation)**
```javascript
{
  patientId: ObjectId,
  prescriptionId: ObjectId,
  date: Date,                            // day
  totalReminders: Number,
  taken: Number,
  missed: Number,
  snoozed: Number,
  adherencePercent: Number               // taken/total * 100
}
```

### How It Works

```
Doctor creates prescription
  │
  ▼ (MongoDB Transaction)
  ├── Insert Prescription document
  ├── Generate MedicineReminder documents for ALL scheduled times
  │   (e.g., 2 meds × 2 times/day × 7 days = 28 reminder docs)
  ├── Enqueue BullMQ delayed jobs for each reminder (scheduled at exact time)
  └── Log to AuditLog
  │
  ▼ (At scheduled time)
  BullMQ fires job
  ├── Check idempotency (already sent? skip)
  ├── Send push notification via Expo Push
  ├── Update reminder status: pending → sent
  ├── If delivery fails → increment attempts, retry (max 3)
  └── If max retries exhausted → move to Dead Letter Queue
  │
  ▼ (Patient interaction)
  Patient taps "Taken" / "Missed" / "Snooze 15min"
  ├── Update reminder status
  ├── If snoozed → re-enqueue BullMQ job at snoozeUntil
  └── Nightly cron: aggregate adherence per patient per day
```

### API Endpoints

```
# Doctor
POST   /api/v1/prescriptions              — Create prescription (triggers reminder generation)
GET    /api/v1/prescriptions               — List my prescriptions (paginated)
GET    /api/v1/prescriptions/:id           — Get prescription detail
PATCH  /api/v1/prescriptions/:id/cancel    — Cancel (stops future reminders)
GET    /api/v1/prescriptions/:id/adherence — Patient adherence stats

# Patient
GET    /api/v1/my/prescriptions            — My active prescriptions
GET    /api/v1/my/reminders                — Today's reminders
PATCH  /api/v1/my/reminders/:id/ack        — Mark taken
PATCH  /api/v1/my/reminders/:id/snooze     — Snooze (body: { minutes: 15 })
PATCH  /api/v1/my/reminders/:id/miss       — Mark missed
GET    /api/v1/my/adherence                — My adherence history
```

### Prescription PDF Generation

```
On creation → generate branded PDF:
  - Doctor name, clinic, license
  - Patient name, age, gender
  - Date of issue
  - Medicines table (name, dose, frequency, duration, instructions)
  - Doctor's digital signature (stored in DoctorProfile)
  - QR code linking to prescription in app
  
Store PDF in S3, save key in Prescription.pdfKey
```

### BullMQ Queue Design

```
Queue: "medicine-reminders"
  - Delayed jobs (processAt = reminder.scheduledAt)
  - Max retries: 3
  - Backoff: exponential (1min, 5min, 15min)
  - Dead Letter Queue: "medicine-reminders-dlq"

Queue: "adherence-aggregation"
  - Repeatable job: every night at 23:59
  - Aggregates day's reminders into ReminderAdherence

Queue: "prescription-pdf"
  - Triggered on prescription creation
  - Generates PDF async (doesn't block API response)
```

### Acceptance Criteria

- [ ] Doctor creates prescription → all reminders generated atomically (transaction)
- [ ] Patient gets push at exact scheduled time (±30 seconds)
- [ ] "Taken" / "Missed" / "Snooze" work correctly, status updates are idempotent
- [ ] Cancelled prescription stops all future reminders (pending jobs removed from queue)
- [ ] Adherence percentage calculated correctly per day
- [ ] PDF generated with correct branding and stored in S3
- [ ] Duplicate prescription creation rejected (idempotency key)
- [ ] Failed notifications retried, eventually land in DLQ

---

## Phase 3: Real-Time Chat System (Doctor ↔ Patient)

**Goal:** Build the real-time messaging infrastructure. Patient chats with their doctor. Messages persist in DB, delivered via WebSocket in real-time. This phase has NO AI — just the raw chat pipe.

**ACID Focus:** Messages are stored with strict ordering guarantees (timestamp + sequence number). Conversation state transitions follow state machine rules.

### Data Models

**Conversation**
```javascript
{
  patientId: ObjectId,
  doctorId: ObjectId,
  organizationId: ObjectId,
  status: enum ['open', 'active', 'resolved', 'archived'],
  lastMessageAt: Date,
  lastMessagePreview: String,           // first 100 chars for list view
  unreadByDoctor: Number,
  unreadByPatient: Number,
  metadata: {
    startedBy: enum ['patient', 'doctor', 'system'],
    resolvedAt: Date | null,
    resolvedBy: ObjectId | null
  },
  createdAt, updatedAt
}
```

**Message**
```javascript
{
  conversationId: ObjectId,
  senderId: ObjectId,
  senderRole: enum ['patient', 'doctor', 'assistant', 'system', 'ai'],
  type: enum ['text', 'image', 'document', 'prescription_link', 'system_event'],
  body: String,
  attachments: [{
    fileKey: String,                     // S3 key
    fileName: String,
    mimeType: String,
    size: Number
  }],
  readAt: Date | null,
  sequence: Number,                      // monotonically increasing per conversation
  idempotencyKey: String,                // clientId + timestamp (prevent duplicate sends)
  deletedAt: Date | null,
  createdAt
}
```

**DeviceToken (for push when offline)**
```javascript
{
  userId: ObjectId,
  token: String,
  platform: enum ['ios', 'android', 'web'],
  isActive: Boolean,
  lastUsedAt: Date,
  createdAt
}
```

### WebSocket Architecture

```
Client connects → Socket.IO with JWT auth
  │
  ▼
  Server validates token → joins user to rooms:
    - room: `user:${userId}` (personal notifications)
    - room: `conv:${conversationId}` (for each active conversation)
  │
  ▼ Events:
  
  Client → Server:
    "message:send"    { conversationId, body, type, idempotencyKey }
    "message:read"    { conversationId, upToMessageId }
    "typing:start"    { conversationId }
    "typing:stop"     { conversationId }
  
  Server → Client:
    "message:new"     { message object }
    "message:read"    { conversationId, readAt, readBy }
    "typing"          { conversationId, userId, isTyping }
    "conversation:updated" { conversation summary }
```

### How It Works

```
Patient sends message
  │
  ▼
  Socket handler receives "message:send"
  ├── Check idempotency (reject if duplicate)
  ├── Validate: patient belongs to this conversation's doctor
  ├── Transaction:
  │   ├── Insert Message (with next sequence number)
  │   ├── Update Conversation (lastMessageAt, unreadByDoctor++)
  │   └── AuditLog (if first message in conversation)
  ├── Emit "message:new" to conversation room (real-time)
  ├── If recipient NOT in room (offline):
  │   └── Queue push notification via BullMQ
  └── Return ACK to sender
```

### Offline Handling

```
User offline when message arrives:
  1. Message stored in DB (always)
  2. Push notification sent (title: doctor/patient name, body: preview)
  3. When user comes online:
     - Client calls GET /api/v1/chat/conversations (gets unread counts)
     - Client calls GET /api/v1/chat/conversations/:id/messages?after=lastSeenSeq
     - Syncs missed messages
```

### API Endpoints (REST fallback + history)

```
# Conversations
GET    /api/v1/chat/conversations                    — My conversations (paginated)
POST   /api/v1/chat/conversations                    — Start new conversation
PATCH  /api/v1/chat/conversations/:id/resolve        — Mark resolved (doctor only)

# Messages
GET    /api/v1/chat/conversations/:id/messages       — Message history (paginated, cursor-based)
POST   /api/v1/chat/conversations/:id/messages       — Send message (REST fallback if WS down)
PATCH  /api/v1/chat/messages/:id/read                — Mark read

# Device tokens
POST   /api/v1/devices                               — Register device token
DELETE /api/v1/devices/:token                         — Unregister
```

### State Machine: Conversation Status

```
  open ──────→ active (first reply from doctor)
    │              │
    │              ├──→ resolved (doctor marks done)
    │              │       │
    │              │       └──→ open (patient sends new message)
    │              │
    └──────────────┴──→ archived (after 30 days inactive)
```

### BullMQ Queues

```
Queue: "chat-push-notifications"
  - Fires when recipient is offline
  - Debounced: if 5 messages in 10 sec, send 1 notification "5 new messages"
  - Respects quiet hours (configurable per user)

Queue: "chat-archive"
  - Nightly cron: archive conversations inactive > 30 days
```

### Acceptance Criteria

- [ ] Real-time message delivery (< 200ms latency on same server)
- [ ] Messages persist even if recipient offline; sync on reconnect
- [ ] Duplicate messages rejected (idempotency key)
- [ ] Unread counts accurate across reconnections
- [ ] Typing indicators work
- [ ] Push notification sent when offline (debounced)
- [ ] Conversation state transitions enforced (can't skip states)
- [ ] Doctor can only see conversations with their patients
- [ ] Message sequence numbers never gap or duplicate per conversation

---

## Revised Revenue Model

**Platform earns from two streams:**
1. **Doctor Registration Fee** — Super Admin sets a monthly/yearly charge. Doctors self-register and pay to get approved.
2. **Patient Subscription Fee** — Patients pay a monthly charge to access their doctor's virtual consultations, chat, and platform features.
3. **Doctor Consultation Fee** — Doctors set their own virtual meeting prices. Platform takes no cut (doctors earn directly from patients per virtual consult).

**Flow:**
```
Doctor self-registers → Pays registration fee → Super Admin approves → Doctor is active
Patient registers under a doctor → Pays monthly subscription → Gets access to virtual consults, chat, prescriptions
Patient books virtual meeting → Pays doctor's consultation fee directly
```

**Key Principles:**
- Doctor approval is manual (Super Admin reviews credentials)
- Registration fee is set globally by Super Admin (not per-doctor)
- Patient subscription is set by Super Admin (platform-level pricing)
- Doctor consultation fee is set by the doctor themselves
- All services gated behind active subscription status
- Nothing is dependent — each module (billing, approval, virtual meetings) works independently but connects via shared user/subscription state

---

## Phase 4: Doctor Self-Registration & Approval System

**Goal:** Doctors can register themselves from a public registration page. They fill credentials, pay the registration fee, and wait for Super Admin approval. Super Admin reviews and approves/rejects. Only approved doctors can use the platform.

**ACID Focus:** Registration + payment is atomic. Approval state machine prevents invalid transitions. Idempotent payment processing.

### Data Models

**DoctorRegistration (new — tracks the application)**
```javascript
{
  userId: ObjectId,                      // the doctor's User record
  organizationId: ObjectId,
  status: enum ['pending_payment', 'pending_approval', 'approved', 'rejected'],
  applicationData: {
    specialization: String,
    qualification: String,
    licenseNumber: String,
    experience: Number,
    clinicName: String,
    clinicAddress: String,
    aboutMe: String,                     // doctor's self-description
    documents: [{                        // uploaded certificates/licenses
      name: String,
      fileKey: String,                   // S3 key
      mimeType: String
    }]
  },
  paymentId: ObjectId | null,            // links to Payment record
  reviewedBy: ObjectId | null,           // Super Admin who approved/rejected
  reviewedAt: Date | null,
  rejectionReason: String | null,
  appliedAt: Date,
  approvedAt: Date | null,
  idempotencyKey: String,                // email-based (one application per email)
  createdAt, updatedAt
}
```

**PlatformPricing (new — Super Admin configures globally)**
```javascript
{
  organizationId: ObjectId,
  doctorRegistrationFee: {
    amount: Number,                      // in paisa (INR)
    currency: String,                    // "INR"
    interval: enum ['one_time', 'monthly', 'yearly'],
    description: String
  },
  patientSubscriptionFee: {
    amount: Number,
    currency: String,
    interval: enum ['monthly', 'yearly'],
    description: String
  },
  platformCommission: Number,            // percentage (0 = no cut on consults, future use)
  isActive: Boolean,
  updatedBy: ObjectId,
  createdAt, updatedAt
}
```

### State Machine: Doctor Registration

```
  pending_payment ──→ pending_approval (payment confirmed)
                           │
                           ├──→ approved (Super Admin approves)
                           │       │
                           │       └── Doctor is now active, can use platform
                           │
                           └──→ rejected (Super Admin rejects)
                                   │
                                   └── Doctor notified with reason, can re-apply
```

### How It Works

```
Doctor visits public registration page
  │
  ▼
  1. Fills form: name, email, phone, password, specialization,
     qualification, license number, experience, clinic info
  2. Uploads supporting documents (license, degree certificates)
  3. Submits → Creates User (role: doctor, isActive: false) + DoctorRegistration (status: pending_payment)
  │
  ▼ (Transaction)
  4. Redirected to payment page (Razorpay/Stripe)
  5. Pays registration fee
  6. Payment webhook confirms → DoctorRegistration.status = 'pending_approval'
  │
  ▼
  7. Super Admin sees pending applications in dashboard
  8. Reviews: credentials, documents, license validity
  9. Approves → Transaction:
     ├── DoctorRegistration.status = 'approved'
     ├── User.isActive = true
     ├── DoctorProfile created (or activated)
     ├── AuditLog entry
     └── Notification sent to doctor (email/push)
  │
  OR Rejects → DoctorRegistration.status = 'rejected', rejectionReason filled
```

### API Endpoints

```
# Public (no auth)
POST   /api/v1/doctors/register          — Doctor self-registration (creates user + application)
POST   /api/v1/doctors/register/payment  — Initiate payment for registration fee
POST   /api/v1/webhooks/doctor-payment   — Payment confirmation webhook

# Super Admin
GET    /api/v1/admin/registrations                — List pending/all doctor applications
GET    /api/v1/admin/registrations/:id            — View application details + documents
PATCH  /api/v1/admin/registrations/:id/approve    — Approve doctor
PATCH  /api/v1/admin/registrations/:id/reject     — Reject (body: { reason })

# Super Admin — Pricing
GET    /api/v1/admin/pricing              — Get current platform pricing
PATCH  /api/v1/admin/pricing              — Update pricing (registration fee, patient sub fee)
```

### Middleware: Doctor Active Gate

```javascript
// Applied on all doctor-only routes
// Checks: User.isActive === true AND DoctorRegistration.status === 'approved'
// Rejects with 403 if doctor not yet approved or subscription expired
```

### Acceptance Criteria

- [ ] Doctor can self-register without Super Admin involvement
- [ ] Registration fee payment is required before application goes to review
- [ ] Super Admin sees all pending applications with uploaded documents
- [ ] Approval atomically activates doctor account + creates profile
- [ ] Rejected doctors get a reason and can re-apply
- [ ] Duplicate registrations (same email) are rejected (idempotency)
- [ ] Doctor cannot access platform features until approved
- [ ] Payment webhook is idempotent (double-processing safe)
- [ ] All state transitions logged in AuditLog

---

## Phase 5: Patient Subscription & Access Control

**Goal:** Patients pay a monthly subscription to access platform features (chat, virtual consults, prescriptions, reminders). Without active subscription, patients can only view basic profile. Super Admin sets the subscription price globally.

**ACID Focus:** Subscription activation/deactivation is transactional. Feature access gated by subscription status. Payment webhooks idempotent.

### Data Models

**PatientSubscription (new)**
```javascript
{
  patientId: ObjectId,                   // Patient record
  userId: ObjectId,                      // User record
  doctorId: ObjectId,                    // which doctor they're subscribed under
  organizationId: ObjectId,
  status: enum ['active', 'past_due', 'cancelled', 'expired'],
  razorpaySubscriptionId: String | null,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelledAt: Date | null,
  cancelReason: String | null,
  autoRenew: Boolean,
  __v: Number,                           // optimistic locking
  createdAt, updatedAt
}
```

**Payment (unified for both doctor registration + patient subscription)**
```javascript
{
  userId: ObjectId,
  organizationId: ObjectId,
  type: enum ['doctor_registration', 'patient_subscription', 'consultation'],
  amount: Number,                        // paisa
  currency: String,
  status: enum ['pending', 'captured', 'failed', 'refunded'],
  razorpayPaymentId: String,
  razorpayOrderId: String | null,
  razorpaySignature: String | null,
  metadata: {
    subscriptionId: ObjectId | null,
    registrationId: ObjectId | null,
    appointmentId: ObjectId | null
  },
  failureReason: String | null,
  idempotencyKey: String,               // razorpayPaymentId (natural idempotency)
  processedAt: Date | null,
  createdAt
}
```

**WebhookEvent (idempotency store — same as original plan)**
```javascript
{
  eventId: String (unique),
  eventType: String,
  payload: Object,
  status: enum ['processing', 'processed', 'failed'],
  processedAt: Date | null,
  error: String | null,
  createdAt
}
```

### Subscription Lifecycle

```
  Patient registers → Pays first month → active
                                            │
                                            ├──→ past_due (renewal failed)
                                            │       │
                                            │       ├──→ active (retry succeeds)
                                            │       └──→ expired (grace period over)
                                            │
                                            └──→ cancelled (patient cancels)
```

### Feature Gating

```javascript
// Middleware: requireActiveSubscription
// Applied on patient routes: chat, book appointment, view prescriptions, reminders
// Checks PatientSubscription.status === 'active'
// If not active → 403 { error: "Subscription required", upgradeUrl: "..." }
```

**What's gated (requires active subscription):**
- Chat with doctor
- Book virtual appointments
- View/download prescriptions
- Medicine reminders
- AI health updates (future)
- Vault access (future)

**What's free (no subscription needed):**
- View profile
- View doctor info
- Basic appointment history (read-only)

### API Endpoints

```
# Patient
GET    /api/v1/my/subscription            — My subscription status
POST   /api/v1/my/subscription            — Subscribe (initiates Razorpay payment)
PATCH  /api/v1/my/subscription/cancel     — Cancel subscription

# Super Admin (pricing already in Phase 4)
GET    /api/v1/admin/subscriptions        — All patient subscriptions (paginated)
GET    /api/v1/admin/revenue              — Revenue breakdown (doctor fees + patient subs)

# Webhooks
POST   /api/v1/webhooks/subscription      — Razorpay subscription webhook
```

### Acceptance Criteria

- [ ] Patient cannot access gated features without active subscription
- [ ] Subscription auto-renews monthly via Razorpay
- [ ] Failed payment → grace period (3 days) → then expired
- [ ] Patient can cancel (access continues until period end)
- [ ] Super Admin can view all subscriptions and revenue
- [ ] Webhook processing is idempotent (no duplicate charges)
- [ ] Free features remain accessible without subscription
- [ ] Subscription scoped to specific doctor (patient pays per doctor relationship)

---

## Phase 6: AI Features (Chat Triage + Health Updates)

**Goal:** AI handles initial patient chat queries using medical context, escalates to doctor when needed. Daily personalized health tips generated for subscribed patients. Gated behind active patient subscription.

**ACID Focus:** AI responses are regular messages (same model). Escalation is a transactional state change. Health updates are idempotent (one per day per patient).

### Data Models

**AIConfig (Super Admin configures)**
```javascript
{
  organizationId: ObjectId,
  provider: enum ['gemini', 'openai'],
  model: String,                         // "gemini-1.5-flash"
  systemPrompt: String,
  maxTokensPerResponse: Number,
  maxDailyTokensPerPatient: Number,
  escalationKeywords: [String],
  isEnabled: Boolean,                    // kill switch
  createdAt, updatedAt
}
```

**AIUsage**
```javascript
{
  patientId: ObjectId,
  doctorId: ObjectId,
  date: Date,
  tokensUsed: Number,
  messagesCount: Number,
  escalations: Number,
  createdAt
}
```

**HealthUpdate**
```javascript
{
  patientId: ObjectId,
  doctorId: ObjectId,
  organizationId: ObjectId,
  date: Date,
  title: String,
  body: String,
  category: enum ['nutrition', 'exercise', 'medication', 'lifestyle', 'condition_specific'],
  basedOn: { conditions: [String], medications: [String] },
  readAt: Date | null,
  idempotencyKey: String,                // patientId + date
  createdAt
}
```

### Updated Conversation States (extends Phase 3)

```
  open ──→ ai_handling ──→ escalated ──→ doctor_handling ──→ resolved
                │                                              │
                └──→ resolved (AI fully handled)               └── archived (30d inactive)
```

### AI Chat Flow

```
Patient sends message (subscription active required)
  │
  ├── If conversation is "doctor_handling" → route to doctor directly
  ├── If "open" or "ai_handling":
  │    ├── Check escalation keywords → immediate escalate if found
  │    ├── Check daily token limit → escalate if exceeded
  │    ├── Build context prompt (patient conditions, meds, allergies)
  │    ├── Call Gemini → parse response
  │    ├── If [ESCALATE] in response → escalate + notify doctor
  │    └── Else → store as Message (senderRole: 'ai'), emit via WebSocket
  └── If patient says "talk to doctor" → immediate escalation
```

### API Endpoints

```
# Super Admin
GET    /api/v1/admin/ai-config           — Get AI settings
PATCH  /api/v1/admin/ai-config           — Update (model, prompts, limits, kill switch)

# Patient (requires active subscription)
GET    /api/v1/my/health-updates         — My health feed
PATCH  /api/v1/my/health-updates/:id/read — Mark read

# Doctor
GET    /api/v1/doctor/ai-usage           — AI usage stats for my patients
```

### Acceptance Criteria

- [ ] AI responds to patient messages in < 3 seconds (subscription gated)
- [ ] AI never diagnoses or prescribes
- [ ] Escalation keywords → immediate doctor notification
- [ ] "Talk to doctor" → bypass AI instantly
- [ ] Daily token limit enforced
- [ ] Super Admin kill switch disables AI globally
- [ ] Health updates: one per patient per day, idempotent
- [ ] All AI features require active patient subscription

---

## Phase 7: Medical Vault & Document Management

**Goal:** Patients upload and manage medical documents. Doctors access patient vault during consultations. Secure S3 storage with presigned URLs. Gated behind patient subscription.

**ACID Focus:** Document ownership strictly enforced. Access is audit-logged. Presigned URLs are time-limited.

### Data Models

**VaultDocument**
```javascript
{
  patientId: ObjectId,
  organizationId: ObjectId,
  uploadedBy: ObjectId,
  uploaderRole: enum ['patient', 'doctor'],
  category: enum ['lab_report', 'xray', 'scan', 'prescription', 'discharge_summary', 'insurance', 'other'],
  title: String,
  description: String | null,
  fileKey: String,                       // S3 key
  fileName: String,
  mimeType: String,
  fileSize: Number,
  tags: [String],
  accessLog: [{ userId: ObjectId, role: String, accessedAt: Date }],
  deletedAt: Date | null,
  createdAt, updatedAt
}
```

### How It Works

```
Upload:
  Patient requests presigned URL → uploads directly to S3 → confirms with metadata
  
View:
  Doctor requests document → presigned download URL (15 min expiry) → access logged

Security:
  - Patient owns their vault
  - Doctor has read access to assigned patients only
  - Every view logged in accessLog
  - Max 25MB per file
  - Whitelist: pdf, jpg, png, dicom
```

### API Endpoints

```
# Patient (requires active subscription)
POST   /api/v1/vault/upload-url           — Get presigned upload URL
POST   /api/v1/vault/documents            — Confirm upload
GET    /api/v1/vault/documents            — My documents (paginated, filterable)
DELETE /api/v1/vault/documents/:id        — Soft delete

# Doctor
GET    /api/v1/doctor/patients/:id/vault  — View patient vault
GET    /api/v1/vault/documents/:id/view   — Presigned download URL (access logged)
```

### Acceptance Criteria

- [ ] Patient can upload documents (subscription gated)
- [ ] Doctor can view assigned patient's vault (access logged)
- [ ] Presigned URLs expire in 15 minutes
- [ ] Files > 25MB rejected
- [ ] Soft-delete preserves data
- [ ] Access log tracks all views

---

## Phase 8: Full Frontend Completion

**Goal:** Complete all UI screens for all roles consuming Phases 4–7 APIs.

### Super Admin Dashboard (superadmin/)

| New Screens | Features |
|-------------|----------|
| Doctor Applications | Pending list, review details, approve/reject with reason |
| Platform Pricing | Set doctor registration fee, patient subscription fee |
| Revenue Dashboard | Breakdown: doctor registrations + patient subs |
| AI Configuration | Model, prompts, limits, kill switch toggle |

### Doctor Dashboard (admin/)

| New Screens | Features |
|-------------|----------|
| Self-Registration Page | Public form, document upload, payment integration |
| Application Status | Doctor sees their approval status after registering |

### Patient Web (client/)

| New Screens | Features |
|-------------|----------|
| Subscription | Current plan status, pay/renew, cancel |
| Vault | Upload docs, categorized gallery, view/download |
| Health Feed | Daily AI tips (gated) |

### Patient Mobile (app/)

| New Screens | Features |
|-------------|----------|
| Chat | Real-time messaging with AI + doctor |
| Prescriptions | View active, download PDF |
| Reminders | Today's schedule, mark taken/missed/snooze |
| Vault | Upload (camera/file), browse documents |
| Subscription | Status, renew, cancel |
| Health Feed | Daily tips |
| Notifications | Push notification history |

### Acceptance Criteria

- [ ] Super Admin can review and approve/reject doctor applications
- [ ] Doctor can self-register, pay, and see application status
- [ ] Patient can manage subscription from any client
- [ ] Vault UI works on web and mobile
- [ ] All gated features show proper "subscription required" messaging

---

## Phase 9: Growth Features & Polish (Optional — Post-Launch)

**Goal:** Features that drive growth and improve UX. Each is independent — build in any order based on priorities.

### 9A: Virtual Video Consultations (Optional)
- Doctors set their own consultation fee
- Patients with active subscription book + pay doctor's fee per consult
- Video via VideoSDK.live or Agora (1:1 calls)
- Requires `expo-dev-client` for mobile (one-time setup)
- Meeting room tokens generated server-side, time-limited
- Cancellation refund logic (2-hour cutoff)
- Platform takes 0% cut initially (configurable later)
- **Note:** Deferred to post-launch. Core platform works without video.

### 9B: OTP / Passwordless Login
- SMS/WhatsApp OTP for patients (phone-only login)
- Doctor still uses email + password

### 9C: WhatsApp Prescription Delivery
- Send PDF via WhatsApp Business API on prescription creation

### 9D: Public Doctor Directory & Booking
- Patients can discover doctors, view profiles, register under a doctor
- SEO-friendly landing pages per doctor

### 9E: Referral Engine
- Patient referral codes → rewards on subscription renewal

### 9F: Offline Camp Mode
- Tablet-first UI for field camps
- Local storage + background sync

### 9G: Voice-to-Text Clinical Notes
- Doctor dictates → transcribed → saved as clinical notes

---

## Phase Dependency & Timeline (Revised)

```
Phase 1 (Multi-Tenancy)     ━━━━━━━━ [DONE]
Phase 2 (Prescriptions)     ━━━━━━━━ [DONE]
Phase 3 (Chat)              ━━━━━━━━ [DONE]
     │
     ├─→ Phase 4 (Doctor Registration + Approval)  ━━━━━━ [Week 1-2]
     │        │
     │        └─→ Phase 5 (Patient Subscription)  ━━━━━━━ [Week 2-3]
     │               │
     │               ├─→ Phase 6 (AI Features)  ━━━━━━━━━━━━ [Week 3-4]
     │               └─→ Phase 7 (Medical Vault)  ━━━━━━━━━━ [Week 3-4]
     │
     └─→ Phase 8 (Full Frontend)  ━━━━━━━━━━━━━━━━━━━━━━━━━ [Week 4-6]
              │
              └─→ Phase 9 (Growth — Optional)  ━━━━━━━━━━━━ [Post-Launch]
```

**Key non-dependency design:**
- Phase 4 (Doctor Reg) works independently — just adds a registration flow + approval gate
- Phase 5 (Patient Sub) works independently — just adds subscription check middleware
- Phase 6 (AI) plugs into existing Chat (Phase 3) — adds AI as a message sender
- Phase 7 (Vault) is fully standalone — just file upload/download with access control
- None of these phases break if another is not implemented — they're connected via shared User/subscription state but not dependent

**Estimated timeline:** 6 weeks for Phases 4–8 (core product launch). Phase 9 is ongoing post-launch.

---

## Cross-Cutting: Updated Security & Middleware

### New Middleware (Phases 4-7)

```javascript
// doctorApprovedGate — blocks unapproved doctors
// requireActiveSubscription — blocks patients without active sub
```

### Payment Webhook Processing (Unified)

```
All Razorpay webhooks → POST /api/v1/webhooks/razorpay
  │
  ├── Verify signature
  ├── Check WebhookEvent (idempotency)
  ├── Route by event type:
  │   ├── "payment.captured" + metadata.type = "doctor_registration" → update DoctorRegistration
  │   ├── "subscription.charged" + metadata.type = "patient_subscription" → extend PatientSubscription
  │   └── "payment.failed" → log, notify
  └── Return 200
```

### Database Indexes (New)

```javascript
// DoctorRegistration
{ organizationId: 1, status: 1 }
{ userId: 1 } (unique)

// PatientSubscription
{ userId: 1, doctorId: 1, status: 1 }
{ currentPeriodEnd: 1, status: 1 }       // for expiry cron

// Payment
{ userId: 1, type: 1, createdAt: -1 }
{ razorpayPaymentId: 1 } (unique)

// VaultDocument
{ patientId: 1, category: 1, deletedAt: 1 }

// HealthUpdate
{ patientId: 1, date: 1 } (unique)

// WebhookEvent
{ eventId: 1 } (unique)
```

---

## Summary: Revenue Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SR+ REVENUE MODEL                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Stream 1: Doctor Registration Fee (monthly/yearly)          │
│    Doctor pays → Super Admin approves → Doctor active        │
│    Revenue: ₹X/month × N doctors                            │
│                                                              │
│  Stream 2: Patient Subscription Fee (monthly)                │
│    Patient pays → Gets access to all features                │
│    Revenue: ₹Y/month × M patients                           │
│                                                              │
│  Stream 3: Virtual Consultation Fee (FUTURE — Phase 9A)      │
│    Patient pays doctor's fee → Doctor earns directly         │
│    Platform takes 0% cut (future: configurable commission)   │
│                                                              │
│  Launch Revenue = (N × ₹X) + (M × ₹Y)                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```
